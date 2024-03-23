# EC2のAuto Scalingの学習

## 構築

- ルートディレクトリで`npm ci`を実行
- cdkディレクトリに移動して`npm ci`を実行
- cdk/cdk.jsonの`scaleSchedulexxxx`を編集
  - 例: 毎時間 10分に起動の場合 `scaleSchedule1StartCron: "10 * * * *"`
  - scaleSchedule1xxxは、終了設定がないものになり、毎分、毎時、毎日、毎月の設定が可能で、繰り返すもの
  - scaleSchedule2xxxは、終了設定があるものになり、1回だけ実行し、繰り返さないもの
- ルートディレクトリで`npm run deploy-dev`を実行
  - 途中で確認が入るので`y`を入力

## 動作確認

- スケジュールのスケール確認
  - EC2のインスタンス画面で、時間になったら起動と終了がされることを確認
- CPU負荷のスケール確認
  - EC2のインスタンス画面で、インスタンスを選択して接続ボタンをクリックする
  - EC2 Instance Connectで接続する
  - ログイン出来たら`stress -c 1`を実行
  - CloudWatch アラームでアラームが発生し、スケールアウトがされることを確認する
