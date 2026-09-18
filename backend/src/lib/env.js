import "dotenv/config";

const readEnvironmentValue = (key) => process.env[key]?.trim();

export const ENV = {
  PORT: readEnvironmentValue("PORT"),
  MONGO_URI: readEnvironmentValue("MONGO_URI"),
  JWT_SECRET: readEnvironmentValue("JWT_SECRET"),
  NODE_ENV: readEnvironmentValue("NODE_ENV"),
  CLIENT_URL: readEnvironmentValue("CLIENT_URL"),
  SERVER_URL: readEnvironmentValue("SERVER_URL"),
  RESEND_API_KEY: readEnvironmentValue("RESEND_API_KEY"),
  EMAIL_FROM: readEnvironmentValue("EMAIL_FROM"),
  EMAIL_FROM_NAME: readEnvironmentValue("EMAIL_FROM_NAME"),
  CLOUDINARY_CLOUD_NAME: readEnvironmentValue("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: readEnvironmentValue("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: readEnvironmentValue("CLOUDINARY_API_SECRET"),
  ARCJET_KEY: readEnvironmentValue("ARCJET_KEY"),
  ARCJET_ENV: readEnvironmentValue("ARCJET_ENV"),
  GOOGLE_CLIENT_ID: readEnvironmentValue("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: readEnvironmentValue("GOOGLE_CLIENT_SECRET"),
  GOOGLE_CALLBACK_URL: readEnvironmentValue("GOOGLE_CALLBACK_URL"),
  GITHUB_CLIENT_ID: readEnvironmentValue("GITHUB_CLIENT_ID"),
  GITHUB_CLIENT_SECRET: readEnvironmentValue("GITHUB_CLIENT_SECRET"),
  GITHUB_CALLBACK_URL: readEnvironmentValue("GITHUB_CALLBACK_URL"),
};

const REQUIRED_ENVIRONMENT_VARIABLES = [
  "MONGO_URI",
  "JWT_SECRET",
  "CLIENT_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_FROM_NAME",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "ARCJET_KEY",
  "ARCJET_ENV",
];

export const validateEnvironment = () => {
  const productionVariables = [
    "SERVER_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_CALLBACK_URL",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "GITHUB_CALLBACK_URL",
  ];
  const requiredVariables = ENV.NODE_ENV === "production"
    ? [...REQUIRED_ENVIRONMENT_VARIABLES, ...productionVariables]
    : REQUIRED_ENVIRONMENT_VARIABLES;
  const missingVariables = requiredVariables.filter((key) => !ENV[key]);

  if (missingVariables.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVariables.join(", ")}`);
  }

  if (ENV.NODE_ENV && !["development", "production", "test"].includes(ENV.NODE_ENV)) {
    throw new Error("NODE_ENV must be development, production, or test");
  }

  const urlVariables = ["CLIENT_URL", "SERVER_URL", "GOOGLE_CALLBACK_URL", "GITHUB_CALLBACK_URL"];
  const invalidURLs = urlVariables.filter((key) => {
    if (!ENV[key]) return false;
    try {
      const url = new URL(ENV[key]);
      return !["http:", "https:"].includes(url.protocol);
    } catch {
      return true;
    }
  });

  if (invalidURLs.length > 0) {
    throw new Error(`Invalid absolute URL environment variables: ${invalidURLs.join(", ")}`);
  }
};

validateEnvironment();
