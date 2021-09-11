# importDensuke
[スケジュール調整サービス「伝助」](https://densuke.biz/) の日程調整情報を取り込むGoogle Apps Scriptライブラリです。  
MIT Licenseのもと公開されています。

## 使用上の注意
伝助には、このような自動化がいいとも悪いとも記載されていません。  
くれぐれも自己責任でご使用ください。

また、このライブラリは、実行するたびに3回のHTTPリクエストを https://densuke.biz に送信します。  
（各リクエストの間には、少なくとも500msの間隔が空けられています。）  
頻回のアクセスはサービス提供元に負荷をかけることになります。  
デバッグ時を含め、実行間隔の確保やキャッシュなどの対策を講じてください。

## デプロイ情報
スクリプトID: `19U1kVR8jl5QJ-yy89hSKym_jrC9wMxQcuX6alsLYzeBfs2-As5ibGKVs`

## 使用例
1. Libraryとしてインポートする  
参考：[Use a Library](https://developers.google.com/apps-script/guides/libraries#use_a_library)

2. コードを実装する

```js
const densukeCds = ['XXXXXXXXXXXXXXXX', 'YYYYYYYYYYYYYYYY'];
densukeCds.forEach((densukeCd, index) => {
  if (index !== 0) {
    // 適切な実行間隔を確保する
    Utilities.sleep(1000);
  }
  
  const values = importDensuke.getValues(densukeCd);
  /*  `values` is like
  [
    ['', '太郎', '花子'],
    ['4月1日', '○', '△'],
    ['4月2日', '-', '×'],
    ['コメント', '', '1日は遅刻しそうです。']
  ]
  */
});
```
