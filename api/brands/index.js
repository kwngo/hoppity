import Router from '@koa/router';
import { PrismaClient } from '@prisma/client'
import Joi from 'joi';

import { SESSION_SECRET_KEY } from '../../utils/vars';

const prisma = new PrismaClient()

const router = new Router({
	prefix: '/brands',
});

router.get('/', async(ctx) => {
	if (!ctx.cookies.get('koa.sess')) {
		ctx.status = 401;
		ctx.body = {"message": "Unauthenticated"};
		return
	}
	const schema = Joi.object({
	})
	try {
		let brands = await prisma.brand.findMany()
		ctx.status = 200
		ctx.body = {
            brands
		}
	} catch(e) {
		ctx.status = 400
		ctx.body = {'message': 'Error creating product'}
	}
})

router.patch('/', async(ctx) => {
	const schema = Joi.object({
        id: Joi.string().required(),
		name: Joi.string().required(),
		description: Joi.string().required(),
	})

	if (!ctx.cookies.get('auth')) {
		ctx.status = 401;
		ctx.body = {"message": "Unauthenticated"};
		return
	}

	try {
		await schema.validateAsync(ctx.request.body)
		const {
            id,
			name,
			description,
		} = ctx.request.body

		let brand = await prisma.brand.findFirst({ id: id })
		let updatedProduct = await prisma.brand.update({
			where: {
				id: product.id,
			},
			data: {
				name,
				description,
			}
		})
		ctx.status = 200;
		ctx.body = {'message': 'Brand updated'}
	} catch(e) {
		ctx.status = 400;
		console.error(e)
		ctx.body = {'message': 'Error updating brand.'}
	}
})

router.post('/', async(ctx) => {
	if (!ctx.cookies.get('koa.sess')) {
		ctx.status = 401;
		ctx.body = {"message": "Unauthenticated"};
		return
	}
	const schema = Joi.object({
		name: Joi.string().required(),
		description: Joi.string().required(),
	})
	try {
		await schema.validateAsync(ctx.request.body)
		const {
			name,
			description,
		} = ctx.request.body
		let newBrand = await prisma.brand.create({
			data: {
				name,
				description,
			}
		})
		ctx.status = 200
		ctx.body = {
			'message': 'Brand successfully created.'
		}
	} catch(e) {
		ctx.status = 400
        console.error(e)
		ctx.body = {'message': 'Error creating brand'}
	}

})

export default router