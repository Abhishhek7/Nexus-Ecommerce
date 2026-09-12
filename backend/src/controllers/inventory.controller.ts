import {Response} from 'express';
import {AuthRequest} from '../middlewares/auth';
import * as s from '../services/inventory.service';
export const update=async(req:AuthRequest,res:Response)=>res.json({success:true,message:'Inventory updated successfully',data:await s.update(req.user!.id,req.user!.role,Number(req.params.id),Number(req.body.availableQuantity))});