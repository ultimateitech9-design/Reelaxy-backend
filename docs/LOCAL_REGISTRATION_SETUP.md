# Local registration and OTP

The backend uses the writable recovered MySQL database `dating_web_app` on
`127.0.0.1:3302`. The database retains its original name even though this
application is named Reelaxy.
The original database on port 3301 runs with `innodb_force_recovery=1`, which
rejects writes and caused `/auth/register/request-otp` to return HTTP 500.
Keep the original data intact; do not point the app back to that recovery instance.

The backend `.env` contains the local database credentials. Its previous
configuration is preserved in `.env.before-otp-db-fix`. Neither file belongs in Git.
This workspace has its own `mysql-recovered-data` directory, copied from the
older `Dating App` workspace. Keep this directory outside Git. The original
copy is unchanged. The connection fix was verified with 473 existing users.

The connection settings before the latest repair are saved in the ignored
`backend/.env.before-database-connection-fix` file. Use the configured local
database account rather than the unrelated MySQL service's root credentials.

Run `npm run dev` inside `backend` to start the recovered local database when
necessary, then start the API and KYC worker. `npm run start` and `npm run start:prod` inside the
backend also check the local database. The helper only applies to Windows loopback
connections on port 3302; it does not start or change a remote database.

Gmail SMTP is configured in the backend `.env` using `SMTP_HOST`, `SMTP_PORT`,
`SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`. Use a valid Google
App Password for the configured sender. Restart the backend after changing `.env`.
Never commit credentials or display OTP codes in API responses.
