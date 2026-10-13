# Sayyar (recar) API — Laravel 13 on PHP 8.4
FROM php:8.4-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends libzip-dev libpng-dev libjpeg-dev libonig-dev unzip \
    && docker-php-ext-configure gd --with-jpeg \
    && docker-php-ext-install pdo_mysql bcmath gd \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

EXPOSE 8000

# Boot: install deps if missing, ensure .env + app key, link storage, wait for
# DB, migrate (and seed on first run), then serve. Code is bind-mounted.
CMD ["sh", "-c", "\
    [ -d vendor ] || composer install --no-interaction --prefer-dist --optimize-autoloader; \
    [ -f .env ] || cp .env.example .env; \
    php -r \"echo trim(getenv('APP_KEY') ?: '');\" | grep -q . || grep -q '^APP_KEY=base64' .env || php artisan key:generate --force; \
    php artisan storage:link --force || true; \
    until php artisan migrate --force 2>/dev/null; do echo 'waiting for db...'; sleep 3; done; \
    php artisan db:seed --force || true; \
    php artisan config:clear || true; \
    php artisan serve --host=0.0.0.0 --port=8000 \
"]
