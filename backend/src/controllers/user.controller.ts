import {Response} from 'express';
import {AuthRequest} from '../middlewares/auth';
import * as s from '../services/user.service';
export const profile=async(req:AuthRequest,res:Response)=>res.json({success:true,message:'Profile fetched successfully',data:await s.profile(req.user!.id)});
export const update=async(req:AuthRequest,res:Response)=>res.json({success:true,message:'Profile updated successfully',data:await s.update(req.user!.id,req.body)});