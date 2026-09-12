import {prisma} from '../config/prisma';
import {AppError} from '../utils/http';
export async function update(userId:number,role:string,productId:number,quantity:number){const p=await prisma.product.findUnique({where:{id:productId}});
if(!p)throw new AppError(404,'Product not found','NOT_FOUND');if(role==='VENDOR'){const v=await prisma.vendor.findUnique({where:{userId}});
if(!v||v.id!==p.vendorId)throw new AppError(403,'You can only manage your own inventory','FORBIDDEN')}return prisma.inventory.update({where:{productId},data:{availableQuantity:quantity}})}