import { FastifyInstance } from 'fastify';
import { logger } from '../config.js';

/**
 * 全局错误处理中间件
 */
export function errorHandler(fastify: FastifyInstance): void {
  fastify.setErrorHandler((error, request, reply) => {
    logger.error(
      {
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
      },
      'Request error'
    );

    const statusCode = error.statusCode || 500;
    const message =
      statusCode === 500
        ? 'Internal Server Error'
        : error.message;

    reply.status(statusCode).send({
      code: statusCode,
      data: null,
      message,
    });
  });
}
