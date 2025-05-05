FROM ruby:3.3.8-slim

# タイムゾーンを Asia/Tokyo に設定
RUN ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime \
    && echo "Asia/Tokyo" > /etc/timezone
ENV TZ=Asia/Tokyo

RUN apt-get update -qq && apt-get install -y nodejs default-mysql-client

# slimイメージに必要なビルドツールとMySQL開発ライブラリをインストール
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    libyaml-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Gemfile /app/Gemfile
COPY Gemfile.lock /app/Gemfile.lock

RUN gem install bundler
# バンドルを確実に実行し、Gemfile.lockを生成
RUN bundle config set --local path '/bundle' && bundle install

COPY . /app

COPY entrypoint.sh /usr/bin/
# entrypoint.sh の改行コードをLFに変換
RUN sed -i -e 's/\r$//' /usr/bin/entrypoint.sh
RUN chmod +x /usr/bin/entrypoint.sh

# ENTRYPOINTで明示的にシェルを指定
ENTRYPOINT ["/bin/sh", "/usr/bin/entrypoint.sh"]

EXPOSE 3000

CMD ["rails", "server", "-b", "0.0.0.0"]
