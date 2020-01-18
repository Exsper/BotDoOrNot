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
    let start = -1;

    if (s1length <= 0 || s2length <= 0) return -1;

    // 当s2.length==1时单独讨论
    if (s2length === 1) {
        if (s1[s1length - 1] === s2[0]) return s1length - 1;
        else return -1;
    }
    // 寻找重复部分
    for (let i = 0; i < s1length; ++i) {
        if (s1[i] === s2[0]) start = i; // 找到相同点，开始核对
        for (let j = 1; j < s2length; ++j) {
            if (i + j >= s1length) { // s1到句末，核对结束
                return start;
            }
            else if (s1[i + j] !== s2[j]) { // 核对中出现不同字符，不是重复部分
                break;
            }
        }
        // s2到句末，s1没到句末，不是重复部分
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
    // 重复词开头为“！”视为恶意代码，不作回应
    let doStringPrefix = doString.substring(0, 1);
    if (doStringPrefix === "!" || doStringPrefix === "！") return "";
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

    // 随机
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
