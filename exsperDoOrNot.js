'use strict';

/**
 * 寻找s1的末尾和s2的开头的重复部分
 * @param {string} s1 字符串aaabb
 * @param {string} s2 字符串bbccc
 * @return {int} 重复部分在s1的起始点 
 */
function LookForTheSame(s1, s2) {
    let s1length = s1.length;
    let s2length = s2.length;

    if (s1length <= 0 || s2length <= 0) return -1;

    // 寻找重复部分
    let length = s1length > s2length ? s2length : s1length;
    while (length > 0) {
        let s1end = s1.substring(s1length - length);
        let s2start = s2.substring(0, length);
        if (s1end === s2start) return s1length - length;
        length -= 1;
    }
    return -1;
}


/**
 * 根据含“不”的选择性询问生成对应回复
 * @param {string} s 接受的消息
 * @return {string} 回复的字符串，如消息不符合规范则返回空字符串
 */
function Reply(s) {
    /*
    let prefix = s.substring(0, 1);
    // 排除非！开头的消息
    if (!(prefix === "!" || prefix === "！")) return "";
    */
    // 排除不含“不”的消息
    if (s.indexOf("不") < 0) return "";
    // 排除含有“不不”的消息（应该不是询问选择的）
    if (s.indexOf("不不") >= 0) return "";
    // 排除过长和过短消息
    if (s.length > 30 || s.length < 4) return "";

    let ask = s.substring(1);
    let asklength = ask.length;

    // 获取所有“不”的位置
    let arrOr = [];
    for (let i = 0; i < asklength; ++i) {
        if (ask[i] === "不") arrOr.push(i);
    }
    // 删除头尾的“不”
    if (arrOr[0] === 0) arrOr = arrOr.slice(1);
    if (arrOr[arrOr.length] === 0) arrOr.pop();
    // 分析所有按“不”拆分情况，找出“不”两边有相同字符串的情况
    let possibleNot = [];
    let possibleStart = [];
    let possibleLength = [];
    for (let i = 0; i < arrOr.length; ++i) {
        let s1 = ask.substring(0, arrOr[i]);
        let s2 = ask.substring(arrOr[i] + 1, ask.length);
        let start = LookForTheSame(s1, s2);
        if (start < 0) continue;
        else {
            possibleNot.push(arrOr[i]);
            possibleStart.push(start);
            possibleLength.push(arrOr[i] - start);
        }
    }
    if (possibleNot.length <= 0) return "";
    // 极端情况： aaabbb不bbbccc不bbbcccddd
    // 一般取最长的那个，如果都一样长那就取最后一个好了
    let indexOfMax = 0;
    let tempMax = possibleLength[0];
    for (let i = 1; i < possibleLength.length; ++i) {
        if (possibleLength[i] > tempMax) {
            tempMax = possibleLength[i];
            indexOfMax = i;
        }
    }

    let doStart = possibleStart[indexOfMax];
    let notIndex = possibleNot[indexOfMax];
    let doLength = possibleLength[indexOfMax];
    // 具体情况：
    // 今天晚上 [吃] 不 [吃] 饭 = 回答：[吃]饭/不[吃]饭
    // 今天晚上 [要] 不 [要] 吃饭 = 回答：[要]吃饭/不[要]吃饭
    // 今天晚上 [吃饭] 不 [吃饭] = 回答：[吃饭]/不[吃饭]
    let doString = ask.substring(doStart, notIndex);
    let endString = "";
    if (notIndex + doLength + 1 < asklength) endString = ask.substring(notIndex + doLength + 1);

    // 细节处理
    // 重复词有“！”视为恶意代码，不作回应（没人会用"学!code不学!code"聊天吧）
    if (doString.indexOf("!") >= 0 || doString.indexOf("！") >= 0) return "";
    // 结束词包含疑问词/符号，取符号前的语句
    if (endString.length > 0) {
        let endStringRegex = /(.*?)(?=\?|？|!|！|,|，|\.|。|呢)+/;
        let matchResult = endString.match(endStringRegex);
        if (matchResult instanceof Array) {
            endString = matchResult[0];
        }
    }

    //输出
    let replyString = doString + endString;
    // 将“我”改成“你”，“你”改成“我”
    let replyStringFix = "";
    for (let i = 0; i < replyString.length; ++i) {
        if (replyString[i] === "我") replyStringFix += "你";
        else if (replyString[i] === "你") replyStringFix += "我";
        else replyStringFix += replyString[i];
    }

    // 1/2 随机
    if (Math.random() < 0.5) replyStringFix = "不" + replyStringFix;
    return replyStringFix;
}



// Koishi插件名
module.exports.name = 'exsperDoOrNot';

// 插件处理和输出
module.exports.apply = (ctx) => {
    ctx.middleware((meta, next) => {
        let ask = meta.message;
        if (ask.substring(0, 1) === "!" || ask.substring(0, 1) === "！") {
            try {
                let replyString = Reply(ask.trim());
                if (replyString === "") return next();
                else return meta.$send(replyString);
            }
            catch (ex) {
                console.log(ex);
                return next();
            }
        } else {
            return next();
        }
    });
};
