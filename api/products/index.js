import Router from '@koa/router';
import { PrismaClient } from '@prisma/client'
import Joi from 'joi';

import { SESSION_SECRET_KEY } from '../../utils/vars';

const prisma = new PrismaClient()

const router = new Router();

router.get('/products', async(ctx) => {
	if (!ctx.cookies.get('koa.sess')) {
		ctx.status = 401;
		ctx.body = {"message": "Unauthenticated"};
		return
	}
	const schema = Joi.object({
	})
	try {
		let products = await prisma.product.findMany()
		ctx.status = 200
		ctx.body = {
			'products': products
		}
	} catch(e) {
		ctx.status = 400
		ctx.body = {'message': 'Error creating product'}
	}
})

router.patch('/products/:id', async(ctx) => {
	const schema = Joi.object({
		name: Joi.string().required(),
		description: Joi.string().required(),
		thumbnail: Joi.string().required(),
		primaryImage: Joi.string().required(),
		price: Joi.string().required,
		specs: Joi.object().required(),
		highlights: Joi.array().required(),
		tags: Joi.array().required()

	})

	if (!ctx.cookies.get('auth')) {
		ctx.status = 401;
		ctx.body = {"message": "Unauthenticated"};
		return
	}

	try {
		await schema.validateAsync(ctx.request.body)
		const {
			name, 
			description, 
			thumbnail, 
			primaryImage, 
			price, 
			highlights, 
			specs, 
			tags
		} = ctx.request.body

		let comment = await prisma.product.findFirst({ id: ctx.params.id })
		let updatedProduct = await prisma.product.update({
			where: {
				id: product.id,
			},
			data: {
				name,
				description,
				thumbnail,
				primaryImage,
				price,
				highlights,
				specs,
				tags
			}
		})
		ctx.status = 200;
		ctx.body = {'message': 'Comment updated'}
	} catch(e) {
		ctx.status = 400;
		console.error(e)
		ctx.body = {'message': 'Error creating new comment.'}
	}
})

router.post('/products', async(ctx) => {
	if (!ctx.cookies.get('koa.sess')) {
		ctx.status = 401;
		ctx.body = {"message": "Unauthenticated"};
		return
	}
	const schema = Joi.object({
		name: Joi.string().required(),
		description: Joi.string().required(),
		amount: Joi.number().required(),
		thumbnail: Joi.string().required(),
		primaryImage: Joi.string().required(),
		brandId: Joi.string().required(),
		tags: Joi.array().required()
	})
	try {
		await schema.validateAsync(ctx.request.body)
		const {
			name,
			description,
			thumbnail,
			primaryImage,
			price,
			highlights,
			specs,
			tags
		} = ctx.request.body
		let bytes = AES.decrypt(ctx.cookies.get('koa.sess'), SESSION_SECRET_KEY) 
		let newProduct = await prisma.product.create({
			data: {
				name,
				description,
				thumbnail,
				primaryImage,
				price,
				highlights,
				specs,
				tags,
			}
		})
		ctx.status = 200
		ctx.body = {
			'message': 'Product successfully created.'
		}
	} catch(e) {
		ctx.status = 400
		ctx.body = {'message': 'Error creating product'}
	}

})

export default router