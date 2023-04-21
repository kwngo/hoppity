import Koa from 'koa';
import Router from '@koa/router'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
const app = new Koa();


app.use(cors({ origin: [
    "http://localhost:3000",
], 
methods: ['GET', 'PUT', 'POST'], 
allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'], 
credentials: true, 
maxAge: 600, 
exposedHeaders: ['*', 'Authorization' ] 
}));
app.use(bodyParser());

// logger

app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.get('X-Response-Time');
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

// x-response-time

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// response

app.use(async ctx => {
  ctx.body = 'Hello World';
});

app.listen(3000);