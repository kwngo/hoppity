import Koa from 'koa';
import Router from '@koa/router'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import * as dotenv from 'dotenv' 
import { Client, envs } from 'stytch';

const app = new Koa();

dotenv.config()

const HOST = `http://localhost:4545`
const magicLinkUrl = `${HOST}/authenticate`

const stytchClient = new Client({
    project_id: process.env.STYTCH_PROJECT_ID,
    secret: process.env.STYTCH_SECRET,
    env: envs.test,
}
);

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

const auth = new Router({
    prefix: '/auth'
})

auth.post('/login_or_create_user', async(ctx) => {
    const params = {
        email: ctx.request.body.email,
        login_magic_link_url: magicLinkUrl,
        signup_magic_link_url: magicLinkUrl,
    };
    const auth = await stytchClient.magicLinks.email.loginOrCreate(params)
    ctx.status = 200
    ctx.body = auth
})

auth.get('/authenticate', async(ctx) => {
    const queryObject = url.parse(req.url,true).query;

    const auth = await stytchClient.magicLinks.authenticate(ctx.request.query.token)
    console.log(auth)
})

app.use(auth.routes())
app.listen(4545);