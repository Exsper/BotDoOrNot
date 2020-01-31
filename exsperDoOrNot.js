'use strict';

function ReplyObject(ask) {
    this.reply = true;
    this.ask = ask;
    this.format = function () {
        if (this.choices.length > 0)
            return this.choices[Math.floor(Math.random() * this.choices.length)];
        else return undefined;
    };
}
ReplyObject.prototype.choices = function (choices) {
    this.choices = choices;
    return this;
};
ReplyObject.prototype.format = function (format) {
    this.format = format;
    return this;
};
ReplyObject.prototype.toString = function () {
    if (typeof this.format === 'function') {
        return this.format();
    } else {
        //default action: return undefined
        return undefined;
    }
};
ReplyObject.prototype.no = function () {
    this.reply = false;
    return this;
};
/**
 * 寻找s1的末尾和s2的开头的重复部分
 * @param {string} s1 字符串aaabb
 * @param {string} s2 字符串bbccc
 * @return {int} 重复部分在s1的起始点 
 */
function LookForTheSame(s1, s2) {
    const s1length = s1.length;
    const s2length = s2.length;

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
 * @return {ReplyObject} 所有可选项
 */
function Reply(s) {
    const reply = new ReplyObject(s);
    // 排除不含“不”的消息
    // 排除含有“不不”的消息（应该不是询问选择的）
    if (!s.includes("不") || s.includes("不不")) return reply.no();
    // 排除过长和过短消息
    if (s.length > 30 || s.length < 4) return reply.no();

    const ask = s.substring(1).trim();
    let asklength = ask.length;

    // 获取所有“不”的位置
    const arrOr = ask.split("").map((word, index) => { if (word === '不') return index; }).filter(e => e !== undefined);


    // 删除头尾的“不”
    if (arrOr[0] === 0) arrOr = arrOr.slice(1);
    if (arrOr[arrOr.length - 1] === 0) arrOr.pop();


    // 分析所有按“不”拆分情况，找出“不”两边有相同字符串的情况
    let possible = arrOr.reduce((acc, or) => {
        const s1 = ask.substring(0, or);
        const s2 = ask.substring(or + 1, asklength);
        const start = LookForTheSame(s1, s2);
        if (start >= 0) {
            acc.not.push(or);
            acc.start.push(start);
            acc.length.push(or - start);
        }
        return acc;
    }, {
        not: [],
        start: [],
        length: []
    });
    if (possible.not.length <= 0) return reply.no();


    // 极端情况： aaabbb不bbbccc不bbbcccddd
    // 一般取最长的那个，如果都一样长那就取最后一个好了
    const indexOfMax = possible.length.lastIndexOf(Math.max(...possible.length));

    const doStart = possible.start[indexOfMax];
    const notIndex = possible.not[indexOfMax];
    const doLength = possible.length[indexOfMax];


    // 具体情况：
    // 今天晚上 [吃] 不 [吃] 饭 = 回答：[吃]饭/不[吃]饭
    // 今天晚上 [要] 不 [要] 吃饭 = 回答：[要]吃饭/不[要]吃饭
    // 今天晚上 [吃饭] 不 [吃饭] = 回答：[吃饭]/不[吃饭]
    const doString = ask.substring(doStart, notIndex);
    let endString = notIndex + doLength + 1 < asklength ? ask.substring(notIndex + doLength + 1) : "";


    // 细节处理
    // 重复词有“！”视为恶意代码，不作回应（没人会用"学!code不学!code"聊天吧）
    if (doString.includes("!") || doString.includes("！")) return reply.no();
    // 结束词包含疑问词/符号，取符号前的语句
    if (endString.length > 0) {
        const endStringRegex = /(.*?)(?=\?|？|!|！|,|，|\.|。|呢)+/;
        const matchResult = endString.match(endStringRegex);
        if (matchResult instanceof Array) {
            endString = matchResult[0];
        }
    }

    //输出
    let replyString = doString + endString;
    // 将“我”改成“你”，“你”改成“我”
    let replyStringFix = replyString.split("").map(char => (char === '我') ? '你' : (char === '你' ? '我' : char)).join("");

    reply.choices = [replyStringFix, `不${replyStringFix}`];
    return reply;
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
                if (!replyString.reply) return next();
                else return meta.$send(replyString.toString());
            } catch (ex) {
                console.log(ex);
                return next();
            }
        } else {
            return next();
        }
    });
};


/* test

let readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.on('line', function (line) {
    let ask = line;
    if (ask.substring(0, 1) === "!" || ask.substring(0, 1) === "！") {
        try {
            let replyString = Reply(ask.trim());
            if (replyString.reply) return console.log(replyString.toString());
        } catch (ex) {
            console.log(ex);
        }
    }
});

*/