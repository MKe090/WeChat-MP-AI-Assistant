$ErrorActionPreference = "Stop"

$base = "http://127.0.0.1:3456"

$health = Invoke-RestMethod "$base/api/health"
$config = Invoke-RestMethod "$base/api/config/ai-modes"
$title = Invoke-RestMethod "$base/api/ai/title-optimize" `
  -Method Post `
  -ContentType "application/json" `
  -Body (@{ title = "如何提升公众号阅读量" } | ConvertTo-Json)
$wechatStart = Invoke-RestMethod "$base/api/wechat/auth/start"
$callback = Invoke-WebRequest $wechatStart.data.authUrl -UseBasicParsing
$auths = Invoke-RestMethod "$base/api/wechat/authorizations"
$short = Invoke-RestMethod "$base/api/tools/short-links" `
  -Method Post `
  -ContentType "application/json" `
  -Body (@{ url = "https://yiban.io/help?page=help#whatIs"; title = "Yiban help" } | ConvertTo-Json)

[pscustomobject]@{
  health = $health.data.status
  aiMode = $config.data.currentMode
  titleScore = $title.data.score
  wechatMode = $wechatStart.data.mode
  callbackStatus = $callback.StatusCode
  authCount = $auths.data.authorizations.Count
  shortUrl = $short.data.shortUrl
} | ConvertTo-Json -Depth 5
