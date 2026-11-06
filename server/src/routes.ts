import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes';
import { locationRouter } from './modules/locations/location.routes';
import { metaRouter } from './modules/meta/meta.routes';
import { notificationRouter } from './modules/notifications/notification.routes';
import { maintenanceRequestRouter } from './modules/maintenance/requests/request.routes';
import { technicianRouter } from './modules/maintenance/technicians/technician.routes';
import { workOrderRouter } from './modules/maintenance/work-orders/workOrder.routes';
import { feedbackRouter } from './modules/maintenance/feedback/feedback.routes';
import { userRouter } from './modules/users/user.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/meta', metaRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/locations', locationRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/maintenance/requests', maintenanceRequestRouter);
apiRouter.use('/technicians', technicianRouter);
apiRouter.use('/maintenance/technicians', technicianRouter);
apiRouter.use('/work-orders', workOrderRouter);
apiRouter.use('/maintenance/work-orders', workOrderRouter);
apiRouter.use('/feedback', feedbackRouter);
apiRouter.use('/maintenance/feedback', feedbackRouter);
