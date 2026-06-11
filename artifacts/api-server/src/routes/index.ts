import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contractsRouter from "./contracts";
import versionsRouter from "./versions";
import commentsRouter from "./comments";
import risksRouter from "./risks";
import sharedRouter from "./shared";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contractsRouter);
router.use(versionsRouter);
router.use(commentsRouter);
router.use(risksRouter);
router.use(sharedRouter);

export default router;
