
import "dotenv/config";

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!accessSecret || !refreshSecret) {
  throw new Error(
    "Не заданы JWT_ACCESS_SECRET и JWT_REFRESH_SECRET в файле .env.",
  );
}

export const jwtConfig = {
  accessSecret,
  refreshSecret,
  accessExpiresIn: "15m",
  refreshExpiresIn: "7d",
} as const;
