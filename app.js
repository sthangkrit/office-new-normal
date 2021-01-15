// Echo reply

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const mssql = require("mssql");

const config = {
    user: 'admin',
    password: '12345678',
    server: 'xxxx',
    database: 'xxxx',
    options: {
        "encrypt": true,
        "enableArithAbort": true
    },
};

// connect to your database
var errdb = mssql.connect(config)
if (errdb) {
    console.log(errdb);
}

const app = express()
const port = process.env.PORT || 4000
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.post('/webhook', (req, res) => {
    let reply_token = req.body.events[0].replyToken         //get replyToken
    var msg = req.body.events[0]
    var id = req.body.events[0].source.userId               //get userd from line
    console.log(msg.message.text)
    console.log(id)
    reply(reply_token, msg) //verify uid
    res.sendStatus(200)
})
app.listen(port)



function checkin(uid) {

    for (var i = 0; i < employee.length; i++) {
        console.log(i + " + " + employee[i].userid)

        if (employee[i].userid === uid) {    //ปกติเช็คว่า วันนี้ลางานไปยัง หรือสถานะอะไร
            return "Checkin สำเร็จ"
        }
    }
    return "ไม่รู้จัก"
}


async function db() {


    var request = await new mssql.Request();

    // Query to the database and get the records 
    request.query('select * from Line_ID', function (err, records) {

        if (err) console.log(err)

        var result = JSON.stringify(records.recordsets)
        console.log(result)
        // console.log(result)

        // Send records as a response 
        // to browser 
        return result
    });

}


async function checkout(reply_token, uid) {

    var request = new mssql.Request();


    var request = await new mssql.Request();
    var command1 = `select Emp_ID from Emp_info WHERE UID = '${uid}' ;`
    // Query to the database and get the records 
    request.query(command1, function (err, records) {

        if (err) {
            console.log(err)
            sendReply(reply_token, "คุณไม่มีสิทธิเข้าใช้งานระบบ")
            return
        }

        var empId = records.recordset[0].Emp_ID
        console.log("empid  " + empId)
        var d = new Date();


        var date = (d.toISOString().slice(0, 19).replace('T', ' ')).split(" ");
        var time = date[1];
        var date = date[0];

        console.log(date)
        console.log(time)

        //Check already checkin
        var command2 = `SELECT Date FROM Report_Work WHERE Emp_ID = ${empId} AND [Date] = '${date}' AND Time_login IS NOT NULL`
        request.query(command2, function (err2, records) {
            if (err2) {
                console.log(err2)
                return
            }
            var result2 = JSON.stringify(records.recordset[0])
            console.log("record :  " + result2)
            if (result2 == null) {
                sendReply(reply_token, "คุณยังไม่ได้เข้าสุ่ระบบ")
                return
            } else {

                var command3 = `SELECT Date FROM Report_Work WHERE Emp_ID = ${empId} AND [Date] = '${date}' AND Time_logout IS NOT NULL`
                request.query(command3, function (err3, records) {
                    if (err3) {
                        console.log(err3)
                        return
                    }
                    var result3 = JSON.stringify(records.recordset[0])
                    console.log("record :  " + result3)
                    if (result3 != null) {
                        sendReply(reply_token, "คุณได้ออกจากระบบไปแล้ว")
                        return
                    } else {

                        var command4 = `UPDATE Report_Work SET Time_logout='${time}' WHERE [Date] = '${date}' AND Time_login IS NOT NULL`
                        request.query(command4, function (err4, records) {
                            if (err4) {
                                console.log(err4)
                                return
                            }

                            var result4 = JSON.stringify(records)
                            console.log(result4)
                            if (result4.recordsets == null)
                                sendReply(reply_token, "ออกจากระบบสำเร็จ")
                            return

                        })

                    }
                })
            }
        })

    });

}


async function leave(reply_token, uid) {
    var request = new mssql.Request();


    var request = await new mssql.Request();
    var command1 = `SELECT Emp_ID from Emp_info WHERE UID = '${uid}' ;`
    // Query to the database and get the records 
    await request.query(command1, async function (err, records) {

        if (err) {
            console.log(err)
            sendReply(reply_token, "คุณไม่มีสิทธิเข้าใช้งานระบบ")
        }

        var empId = records.recordset[0].Emp_ID
        console.log("empid  " + empId)
        var d = new Date();


        var date = (d.toISOString().slice(0, 10))
        // var date = date[0];
        console.log(date)


        // Check if already checkin then can't leave cause it would be checkout
        var command2 = `SELECT Date FROM Report_Work WHERE Emp_ID = ${empId} AND [Date] = '${date}' AND Time_login is NOT NULL`
        await request.query(command2, async function (err2, records) {
            if (err2) {
                console.log(err2)
            }
            var result = JSON.stringify(records.recordset[0])
            console.log("record :  " + result)
            // console.log("ssadasd " +result.recordset)
            if (result != null) {
                sendReply(reply_token, "คุณต้องออกจากระบบก่อน")
                return
            }
            else {

                var command3 = `SELECT Location FROM Report_Work WHERE Emp_ID = ${empId} AND [Date] = '${date}' AND Location = 'leave'`
                await request.query(command3, async function (err3, records) {
                    if (err3) {
                        console.log(err3)
                    }
                    if (records.recordset[0] != null) {
                        sendReply(reply_token, "คุณได้ลางานไปแล้ว")
                        return
                    }

                    //Check if already outnumber of vacation
                    var command4 = `SELECT COUNT(Report_work_ID) AS sum FROM Report_Work WHERE Emp_ID = ${empId} AND Location = 'leave' `
                    await request.query(command4, async function (err4, records) {
                        if (err4) {
                            console.log(err4)
                        }
                        var sumLeave = JSON.stringify(records.recordset[0].sum)
                        console.log(sumLeave)
                        if (sumLeave < 9) {
                            // All pass then you can leave
                            var command4 = `INSERT INTO Report_Work ([Date],Location,Emp_ID) VALUES ('${date}','leave','${empId}') `
                            await request.query(command4, function (err4, records) {
                                if (err4) {
                                    console.log(err4)
                                }
                                var result = JSON.stringify(records)
                                console.log(result)
                                sendReply(reply_token, "ลางานสำเร็จ")
                                return
                            })
                        } else {
                            console.log("มึงลาครบแล้ว")
                            sendReply(reply_token, "คุณไม่เหลือวันลาแล้ว")
                            return

                        }
                    })
                })
            }

        })



    });

}



async function reply(reply_token, msg) {

    var text = ((msg.message).text).toLowerCase()

    if (text === "checkin") {
        checkin(reply_token, msg.source.userId)
    } else if (text === "checkout") {
        checkout(reply_token, msg.source.userId)
    } else if (text === "leave") {
        leave(reply_token, msg.source.userId)
        console.log(msg)
    } else if (text === "db") {
        result = await db()
        console.log("result : " + result)
    }
    else {
        msg = "boibotไม่เข้าใจฮะ"
        sendReply(reply_token, msg)
    }

}


async function sendReply(reply_token, msg) {
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {eHM8mqLjF+wJdFRirGskG92DHiPlNhkpL1cfmD4KXwakKk9PVGYcmTuwKB+ayTPoGDMfT1PFlrY1fc9+JttXUqW75eTQo5PJeQp0i4LlbANcBJj2663F5qmP6/1efdEpTUx7H95Sro+lAVFWKQdTdwdB04t89/1O/w1cDnyilFU=}'
    }


    let body = JSON.stringify({
        replyToken: reply_token,
        messages: [{
            type: 'text',
            text: msg
        }]
    })
    request.post({
        url: 'https://api.line.me/v2/bot/message/reply',
        headers: headers,
        body: body
    }, (err, res, body) => {
        console.log('status = ' + res.statusCode);
    });
}



