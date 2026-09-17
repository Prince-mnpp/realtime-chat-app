import TryCatch from "../config/TryCatch";
import { AuthenticatedRequest } from "../middlewares/isAuth";
import { Chat } from "../models/Chat";
import { Messages } from "../models/Messages";
import axios from "axios";

export const createNewChat = TryCatch(async(req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;
  const {otherUserId } = req.body;

  if(!otherUserId){
    res.status(400).json({
      message: "Other useId is required",
    })
    return;
  }

  const existingChat = await Chat.findOne({
    users: {$all: [userId, otherUserId], $size: 2},
  });

  if(existingChat){
    res.json({
      message: "Chat already exists",
      chatId: existingChat._id,
    });
    return;
  }

  const newChat = await Chat.create({
    users: [userId, otherUserId],
  });

  res.status(201).json({
    message: "New Chat Created",
    chatId: newChat._id,
  });
});

export const getAllChats = TryCatch(async(req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;

  if(!userId){
    res.status(404).json({
      message: "UserId missing",
    })
    return;
  }

  const chats = await Chat.find({ users: userId }).sort({ updatedAt: -1});

  const chatWithUserData = await Promise.all(
    chats.map(async(chat) => {
      const otherUserId = chat.users.find((id) => id !== userId);

      const unseenCount = await Messages.countDocuments({
        chatId: chat._id,
        sender: {$ne: userId},
        seen: false,
      });

      try {
        const {data} = await axios.get(
          `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`
        );

        return {
          user: data,
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage || null,
            unseenCount,
          },
        };
      } catch (error) {
        console.log(error);
        return {
          user: {_id: otherUserId, name: "Unknown User"},
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage || null,
            unseenCount,
          },
        };
      }
    })
  );

  res.json({
    chats: chatWithUserData,
  })
});

export const sendMessage = TryCatch(async(req: AuthenticatedRequest, res) => {
  const senderId = req.user?._id;

  const {chatId, text} = req.body;
  const imageFile = req.file;

  if(!senderId){
    res.status(401).json({
      message: "unauthorized",
    });
    return;
  }

  if(!chatId){
    res.status(400).json({
      message: "ChatId Required",
    });
    return;
  }

  if(!text && !imageFile){
    res.status(400).json({
      message: "either text or image is required"
    });
    return;
  }

  const chat = await Chat.findById(chatId);

  if(!chat){
    res.status(404).json({
      message: "Chat not found",
    });
    return;
  }

  const isUserInChat = chat.users.some(
    (userId) => userId.toString() === senderId.toString()
  );

  if(!isUserInChat){
    res.status(403).json({
      message: "You are not a participant of this chat",
    });
    return;
  }

  const otherUserId = chat.users.find(
    (userId) => userId.toString() !== senderId.toString()
  );

  if(!otherUserId){
    res.status(401).json({
      message: "No other user",
    });
    return;
  };


});

export const getMessageByChat = TryCatch(async(req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;
  const { chatId } = req.params;

  if(!userId){
    res.status(401).json({
      message: "Unauthorized"
    })
    return;
  }

  if(!chatId){
    res.status(400).json({
      message: "chatId Required"
    })
    return;
  }

  const chat = await Chat.findById(chatId);

  if(!chat){
    res.status(404).json({
      message: "Chat not found"
    })
    return;
  }

  const isUserInChat = chat.users.some(
    (userid) => userid.toString() === userId.toString() 
  );

  if(!isUserInChat){
    res.status(403).json({
      message: "You are not a participant of this chat"
    })
    return;
  }

  const messagesToMarkSeen = await Messages.find({
    chatId: chatId,
    sender: {$ne: userId},
    seen : false,
  });

  await Messages.updateMany(
    {
      chatId: chatId,
      sender: { $ne: userId },
      seen : false
    },
    {
      seen: true,
      seenAt: new Date(),
    }
  );

  const messages = await Messages.find({ chatId }).sort({ createdAt: 1 });

  const otherUserId = chat.users.find((id) => id !== userId);

  const {data} = await axios.get(
    `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`
  );

  if(!otherUserId){
    res.status(400).json({
      message: "No other User"
    })
    return;
  }

  res.json({
    messages,
    user: data,
  });
});