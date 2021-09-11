/*
Copyright 2021 kokko-san

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/


/**
 * HTTPのレスポンスコードが不正なときのエラー
 */
class HTTPResponseCodeError extends Error {
  constructor(message) {
    super(message);
    this.name = "HTTPResponseCodeError";
  }
}


/**
 * 文字列から目的の値を探し出せなかったときのエラー
 */
class MatchNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "MatchNotFoundError";
  }
}


/**
 * 伝助のUrlパラメータ`cd`から、出欠データの配列を取得する。
 * 内部的には、伝助から発行されるCSVを取得している。
 * 
 * @param {string} densukeCd 伝助から発行される、出欠調査を一意に定めるコード。
 * @param {boolean} [lastUpdated=false] 取得する情報に入力内容の最終更新日時を含めるか。
 * @param {boolean} [comment=true] 入力者のコメントを含めるか。
 * @return {Array.<Array.<string>> 出欠調査の表。下に最終更新日時やコメントが付与される。
 */
function getValues(densukeCd, lastUpdated=false, comment=true) {
  const hnObject = getHnObject_(densukeCd);
  Utilities.sleep(500);
  const csvUrl = getCsvUrl_(densukeCd, hnObject, lastUpdated, comment);
  Utilities.sleep(500);
  const csvContent = getCsvContent_(csvUrl, hnObject.cookie);

  return Utilities.parseCsv(csvContent);
}


/**
 * csrf対策を兼ねていると思われる、`hn`を取得する。
 * 発行されるCookie、deviceidも管理する。
 * 
 * @param {string} densukeCd 伝助から発行される、出欠調査を一意に定めるコード。
 * @return {Object.<string, string>} hnとdeviceid(Cookie)に関する情報をまとめたObject。
 */
function getHnObject_(densukeCd) {
  const url = `https://densuke.biz/csvsetting?cd=${densukeCd}`;
  const res = UrlFetchApp.fetch(url);

  if (res.getResponseCode() !== 200) {
    throw HTTPResponseCodeError(
      `${res.getResponseCode()} was returned on fetching ${url}`
    );
  }

  const hnMatch = res.getContentText().match(
    /<input type="hidden" name="hn" value="(\d+)">/
  );
  const deviceidMatch = res.getHeaders()['Set-Cookie'].match(
    /^deviceid=([a-zA-Z0-9]+);/
  );

  if (hnMatch === null) {
    throw MatchNotFoundError(
      `value named hn was not found in ${url}`
    );
  }
  if (deviceidMatch === null) {
    throw MatchNotFoundError(
      `cookie named deviceid was not found in res header: SetCookie=${res.getHeaders()['Set-Cookie']}`
    );
  }
  
  return hnObject = {
    hn: hnMatch[1],
    cookie: `deviceid=${deviceidMatch[1]}`
  } 
}


/**
 * 一時的に発行される、CSVをダウンロードするURLを取得する。
 * hnやdeviceid(Cookie)を送信し、エラーを回避する。
 * 
 * @param {string} densukeCd 伝助から発行される、出欠調査を一意に定めるコード。
 * @param {Object.<string, string>} hnObject hnとdeviceid(Cookie)に関する情報をまとめたObject。
 * @param {boolean} lastUpdated 取得する情報に入力内容の最終更新日時を含めるか。
 * @param {boolean} comment 入力者のコメントを含めるか。
 * @return {string} CSVをダウンロードできるURL。
 */
function getCsvUrl_(densukeCd, hnObject, lastUpdated, comment) {
  const url = `https://densuke.biz/csvout?cd=${densukeCd}`;
  const options = {
    method: 'post',
    payload: {
      hn: hnObject.hn,
      charcode: 'utf8',              // 文字コードはUTF-8
      lastupd: lastUpdated ? 1 : 0,  // 最終更新日時をつけない
      comm: comment ? 1 : 0          // コメントをつける
    },
    headers: {
      Cookie: hnObject.cookie
    }
  };
  const res = UrlFetchApp.fetch(url, options);

  if (res.getResponseCode() !== 200) {
    throw HTTPResponseCodeError(
      `${res.getResponseCode()} was returned on fetching ${url}`
    );
  }

  const re = new RegExp(`<a href="csv\/(${densukeCd}_[a-zA-Z0-9]+\.csv)">`);
  const csvUrlMatch = res.getContentText().match(re);

  if (csvUrlMatch === null) {
    throw MatchNotFoundError(
      `csv url was not found in ${url}`
    );
  }

  return csvUrlMatch[1];
}


/**
 * URL先のCSVを取得する。
 * 
 * @param {string} csvUrl CSVを取りに行くURL。
 * @param {string} cookie deviceidに関するCookie情報。
 * @return {string} CSVの中身の文字列。
 */
function getCsvContent_(csvUrl, cookie) {
  const url = `https://densuke.biz/csv/${csvUrl}`;
  const options = {
    headers: {
      Cookie: cookie
    }
  };

  const res = UrlFetchApp.fetch(url, options);

  if (res.getResponseCode() !== 200) {
    throw HTTPResponseCodeError(
      `${res.getResponseCode()} was returned on fetching ${url}`
    );
  }

  return res.getContentText();
}
