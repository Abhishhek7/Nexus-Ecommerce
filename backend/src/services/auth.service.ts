import bcrypt from 'bcryptjs'; import jwt from 'jsonwebtoken';
import {prisma} from '../config/prisma';
import {env} from '../config/env'; import {AppError} from '../utils/http';
export async function register(input:any){const exists=await prisma.user.findUnique({where:{email:input.email}});
if(exists)throw new AppError(409,'Email already registered','EMAIL_EXISTS');
const passwordHash=await bcrypt.hash(input.password,12);
const user=await prisma.user.create({data:{name:input.name,email:input.email,passwordHash,role:input.role,vendor:input.role==='VENDOR'?{create:{businessName:`${input.name}'s Store`}}:undefined},select:{id:true,name:true,email:true,role:true,status:true,vendor:true}});return user;}
export async function login(input:any){const user=await prisma.user.findUnique({where:{email:input.email}});if(!user||!(await bcrypt.compare(input.password,user.passwordHash)))throw new AppError(401,'Invalid credentials','INVALID_CREDENTIALS');if(user.status!=='ACTIVE')throw new AppError(403,'User account is not active','ACCOUNT_INACTIVE');
const accessToken=jwt.sign({id:user.id,role:user.role},env.JWT_SECRET,{expiresIn:env.JWT_EXPIRES_IN as any});return {accessToken,user:{id:user.id,name:user.name,email:user.email,role:user.role}};}
