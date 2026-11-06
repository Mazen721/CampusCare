import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes';
import { locationRouter } from './modules/locations/location.routes';
import { metaRouter } from './modules/meta/meta.routes';
import { notificationRouter } from './modules/notifications/notification.routes';
import { maintenanceRequestRouter } from './modules/maintenance/requests/request.routes';
import { userRouter } from './modules/users/user.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/meta', metaRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/locations', locationRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/maintenance/requests', maintenanceRequestRouter);
