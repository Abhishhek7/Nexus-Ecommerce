import cors from 'cors';
 import helmet from 'helmet';
  import rateLimit from 'express-rate-limit'; import {env} from '../config/env'; 
  export const security=[helmet(),cors({origin:env.CORS_ORIGIN,credentials:true}),rateLimit({windowMs:15*60*1000,max:300,standardHeaders:true,legacyHeaders:false})];