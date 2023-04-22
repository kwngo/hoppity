import Koa from 'koa';
import Router from '@koa/router'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import Session from 'koa-session'
import { PrismaClient } from '@prisma/client'
import CryptoJS from 'crypto-js'
import AES from 'crypto-js/aes'
import crypto from 'crypto'
import * as dotenv from 'dotenv' 
import { Client, envs } from 'stytch';
import sgMail from '@sendgrid/mail'
import {DateTime} from 'luxon';

import products from './api/products'

const app = new Koa();

dotenv.config()

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const saltRounds = 10;

const SESSION_SECRET_KEY = process.env.NODE_ENV == 'development' ? 'fakesecretkey' : process.env.SESSION_SECRET_KEY;
const prisma = new PrismaClient()

const CONFIG = {
	key: 'koa.sess', /** (string) cookie key (default is koa.sess) */
	/** (number || 'session') maxAge in ms (default is 1 days) */
	/** 'session' will result in a cookie that expires when session/browser is closed */
	/** Warning: If a session cookie is stolen, this cookie will never expire */
	maxAge: 86400000,
	autoCommit: true, /** (boolean) automatically commit headers (default true) */
	overwrite: true, /** (boolean) can overwrite or not (default true) */
	httpOnly: true, /** (boolean) httpOnly or not (default true) */
	signed: true, /** (boolean) signed or not (default true) */
	rolling: false, /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
	renew: false, /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/
	secure: true, /** (boolean) secure cookie*/
	sameSite: null, /** (string) session cookie sameSite options (default null, don't set it) */
};


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
app.use(Session(CONFIG, app))

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

auth.post('/signup', async(ctx) => {
	const schema = Joi.object({
        username: Joi.date().required(),
		email: Joi.string().email({ tlds: { allow: false } }).required(),
		password: Joi.string()
			.pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
		passwordConfirmation: Joi.ref('password'),
	})
	try {
		await schema.validateAsync(ctx.request.body)
		const {
            username,
			email,
			password,
		} = ctx.request.body

		let user = await prisma.user.findUnique({
			where: {
				email: ctx.request.body.email
			}
		})
		if (user != null) {
			ctx.status = 400
			ctx.body = {message: 'Email already exists'}
			return
		}
		let salt = await Bcrypt.genSalt(saltRounds)
		let passwordDigest = await Bcrypt.hash(password, salt)
		let emailVerificationToken = crypto.randomBytes(16).toString('hex')

		const newUser = await prisma.user.create({
			data: {
				email: email,
				passwordDigest: passwordDigest,
				emailVerificationToken: emailVerificationToken,
				emailVerificationTokenExpiresAt: DateTime.now().plus({hours: 4}).toJSDate(),
				settings: {
					create: {
						firstName: firstName,
						country: country,
					}
				},
				registry: {
					create: {
						name: registryName,
						partnerFirstName: partnerFirstName,
						babyDueDate: dueDate,
					}
				}
			}
		})
		let encryptedCookie = AES.encrypt(ctx.request.body.email, SESSION_SECRET_KEY).toString()
		ctx.cookies.set('koa.sess', encryptedCookie, { httpOnly: true, 
			secure: process.env.NODE_ENV === "production" ? true : false,
			domain: process.env.NODE_ENV === "development" ? "localhost" : ""
		})


		let msg = {
			from: "kareem.kwong@hey.com", // verified sender email
			personalizations: [{
				to: [
					{email: ctx.request.body.email}
				],
				dynamic_template_data: {verifyUrl: `http://localhost:3001/onboarding?verification_token=${emailVerificationToken}`,
				subject: "Verify your email", // Subject line
			}
			}],
			template_id: 'd-c4b4d87118384095a3ad7dff94066500'
		} 

		const mailInfo = await sgMail.send(msg);

		console.log("Message sent: %s", mailInfo);

		ctx.status = 200;
		ctx.body = {"message": "success"}
	} catch(err) {
		ctx.status = 500
		console.error(err)
		ctx.body = {message: "Error"} 
	}

})

auth.post('/login', async(ctx) =>{
	if (ctx.cookies.get('koa.sess')) {
		ctx.status = 201;
		ctx.body = {"message": "Already logged in"};
		return
	}
	const schema = Joi.object({
		email: Joi.string().required(),
		password: Joi.string()
			.pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required()
	})
	try {
		await schema.validateAsync(ctx.request.body)
		let user = await prisma.user.findUnique({where:{email: ctx.request.body.email}})
		if (!user) {
			ctx.status = 400
			ctx.body = {message: 'User not found'}
		} 
		if (!user.emailVerified) {
			ctx.status = 400
			ctx.body = {message: 'User email not verified'}
		}
		await Bcrypt.compare(ctx.request.body.password, user.passwordDigest)
		let encryptedCookie = AES.encrypt(ctx.request.body.email, SESSION_SECRET_KEY).toString()
		ctx.cookies.set('koa.sess', encryptedCookie, { httpOnly: true, 
			secure: process.env.NODE_ENV === "production" ? true : false,
			domain: process.env.NODE_ENV === "development" ? "localhost" : ""
		})
		ctx.status = 200;
		ctx.body = {'authenticated': true, 'email': user.email}
	} catch(err){
		ctx.status = 500
		console.log(err)
		ctx.body = {message: err}
	}

})

app.use(auth.routes())
app.use(products.routes())

app.listen(4545);