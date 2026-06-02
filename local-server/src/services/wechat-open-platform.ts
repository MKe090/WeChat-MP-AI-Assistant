import { config } from '../config.js';
import { getDb } from '../database/index.js';

interface WechatApiResponse {
  errcode?: number;
  errmsg?: string;
  [key: string]: any;
}

export class WechatOpenPlatformService {
  async createAuthorization(): Promise<{
    mode: 'mock' | 'wechat';
    authUrl: string;
    expiresIn: number;
  }> {
    if (config.wechatAuthMock) {
      const authCode = `mock_${Date.now()}`;
      return {
        mode: 'mock',
        authUrl: `http://${config.host}:${config.port}/api/wechat/auth/callback?auth_code=${authCode}&expires_in=600`,
        expiresIn: 600,
      };
    }

    this.assertWechatConfig();
    const componentAccessToken = await this.getComponentAccessToken();
    const preAuthCode = await this.createPreAuthCode(componentAccessToken);
    const redirectUri = encodeURIComponent(config.wechatRedirectUri);
    const authUrl =
      `https://mp.weixin.qq.com/cgi-bin/componentloginpage` +
      `?component_appid=${config.wechatComponentAppId}` +
      `&pre_auth_code=${preAuthCode}` +
      `&redirect_uri=${redirectUri}` +
      `&auth_type=1`;

    return { mode: 'wechat', authUrl, expiresIn: 600 };
  }

  async handleCallback(authCode: string): Promise<any> {
    if (!authCode) {
      throw new Error('Missing auth_code');
    }

    const data = config.wechatAuthMock
      ? this.buildMockAuthorization(authCode)
      : await this.exchangeAuthorizationCode(authCode);

    this.saveAuthorization(data);
    return data;
  }

  listAuthorizations(): any[] {
    return getDb()
      .prepare(
        `SELECT id, authorizer_appid, nick_name, service_type, verify_type,
                head_img, qrcode_url, principal_name, expires_at, created_at, updated_at
         FROM wechat_authorizations
         ORDER BY updated_at DESC`
      )
      .all();
  }

  private async getComponentAccessToken(): Promise<string> {
    const res = await this.postWechat('/cgi-bin/component/api_component_token', {
      component_appid: config.wechatComponentAppId,
      component_appsecret: config.wechatComponentAppSecret,
      component_verify_ticket: config.wechatComponentVerifyTicket,
    });
    return res.component_access_token;
  }

  private async createPreAuthCode(componentAccessToken: string): Promise<string> {
    const res = await this.postWechat(
      `/cgi-bin/component/api_create_preauthcode?component_access_token=${componentAccessToken}`,
      { component_appid: config.wechatComponentAppId }
    );
    return res.pre_auth_code;
  }

  private async exchangeAuthorizationCode(authCode: string): Promise<any> {
    const componentAccessToken = await this.getComponentAccessToken();
    const authRes = await this.postWechat(
      `/cgi-bin/component/api_query_auth?component_access_token=${componentAccessToken}`,
      {
        component_appid: config.wechatComponentAppId,
        authorization_code: authCode,
      }
    );
    const authInfo = authRes.authorization_info;
    const infoRes = await this.postWechat(
      `/cgi-bin/component/api_get_authorizer_info?component_access_token=${componentAccessToken}`,
      {
        component_appid: config.wechatComponentAppId,
        authorizer_appid: authInfo.authorizer_appid,
      }
    );

    return {
      authorization_info: authInfo,
      authorizer_info: infoRes.authorizer_info || {},
      raw: { authRes, infoRes },
    };
  }

  private async postWechat(path: string, body: any): Promise<WechatApiResponse> {
    const res = await fetch(`https://api.weixin.qq.com${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as WechatApiResponse;
    if (!res.ok || (json.errcode && json.errcode !== 0)) {
      throw new Error(`WeChat API failed: ${json.errcode || res.status} ${json.errmsg || res.statusText}`);
    }
    return json;
  }

  private saveAuthorization(data: any): void {
    const authorizationInfo = data.authorization_info || {};
    const authorizerInfo = data.authorizer_info || {};
    const appId = authorizationInfo.authorizer_appid;
    if (!appId) {
      throw new Error('Missing authorizer_appid in WeChat authorization response');
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = Number(authorizationInfo.expires_in || 7200);
    getDb()
      .prepare(
        `INSERT INTO wechat_authorizations (
           id, authorizer_appid, nick_name, service_type, verify_type,
           head_img, qrcode_url, principal_name, authorizer_access_token,
           authorizer_refresh_token, expires_at, func_info, raw_json, updated_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(authorizer_appid) DO UPDATE SET
           nick_name = excluded.nick_name,
           service_type = excluded.service_type,
           verify_type = excluded.verify_type,
           head_img = excluded.head_img,
           qrcode_url = excluded.qrcode_url,
           principal_name = excluded.principal_name,
           authorizer_access_token = excluded.authorizer_access_token,
           authorizer_refresh_token = excluded.authorizer_refresh_token,
           expires_at = excluded.expires_at,
           func_info = excluded.func_info,
           raw_json = excluded.raw_json,
           updated_at = datetime('now')`
      )
      .run(
        crypto.randomUUID(),
        appId,
        authorizerInfo.nick_name || 'Mock 公众号',
        String(authorizerInfo.service_type_info?.id ?? ''),
        String(authorizerInfo.verify_type_info?.id ?? ''),
        authorizerInfo.head_img || '',
        authorizerInfo.qrcode_url || '',
        authorizerInfo.principal_name || '',
        authorizationInfo.authorizer_access_token || '',
        authorizationInfo.authorizer_refresh_token || '',
        now + expiresIn,
        JSON.stringify(authorizationInfo.func_info || []),
        JSON.stringify(data)
      );
  }

  private buildMockAuthorization(authCode: string): any {
    return {
      authorization_info: {
        authorizer_appid: 'mock_authorizer_appid',
        authorizer_access_token: `mock_access_${authCode}`,
        authorizer_refresh_token: `mock_refresh_${authCode}`,
        expires_in: 7200,
        func_info: [{ funcscope_category: { id: 1 } }],
      },
      authorizer_info: {
        nick_name: '本地测试公众号',
        service_type_info: { id: 2 },
        verify_type_info: { id: 0 },
        principal_name: 'Wechat260531 Local',
      },
      raw: { mock: true, authCode },
    };
  }

  private assertWechatConfig(): void {
    const missing = [
      ['WECHAT_COMPONENT_APPID', config.wechatComponentAppId],
      ['WECHAT_COMPONENT_APPSECRET', config.wechatComponentAppSecret],
      ['WECHAT_COMPONENT_VERIFY_TICKET', config.wechatComponentVerifyTicket],
      ['WECHAT_REDIRECT_URI', config.wechatRedirectUri],
    ].filter(([, value]) => !value);
    if (missing.length > 0) {
      throw new Error(`Missing WeChat config: ${missing.map(([key]) => key).join(', ')}`);
    }
  }
}
