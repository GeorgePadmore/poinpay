import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from 'utils/Interfaces';

export async function jwtAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify<JwtPayload>();
  } catch (err) {
    reply.send(err);
  }
}
