"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const AppError_1 = require("../shared/errors/AppError");
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const details = error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                }));
                next(new AppError_1.ValidationError('Validation failed', details));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validate = validate;
