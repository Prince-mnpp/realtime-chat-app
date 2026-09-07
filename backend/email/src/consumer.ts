import amqp from "amqplib";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

export const startSendOtpCustomer = async () => {
  try {
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: process.env.Rabbitmq_Host!,
      port: 5672,
      username: process.env.Rabbitmq_Username!,
      password: process.env.Rabbitmq_Password!,
    })

    const channel = await connection.createChannel();

    const queueName = "send-otp";

    await channel.assertQueue(queueName, { durable: true });

    console.log("✅ Mail service consumer started, listening to otp emails");

    channel.consume(queueName, async(msg) => {
      if(msg){
        try{
          const {to, subject, body} = JSON.parse(msg.content.toString());

          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth:{
              user: process.env.USER!,
              pass: process.env.PASSWORD!,
            },
          });

          await transporter.sendMail({
            from: "Chat App",
            to,
            subject,
            text: body,
          });

          console.log(`OTP mail sent to ${to}`);
          channel.ack(msg);
        }
        catch(err){
          console.log("Failed to send otp", err);
        }
      }
    })

  } catch (error) {
    console.log("failed to start rabbitmq consumer", error);
  }
}