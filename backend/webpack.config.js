module.exports = {
  // 他のwebpack設定
  devServer: {
    overlay: {
      warnings: false, // 警告を非表示
      errors: false,   // エラーを非表示
    },
    client: {
      webSocketURL: false, // WebSocket接続を無効にする
    },
  },
};
