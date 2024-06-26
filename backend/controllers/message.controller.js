import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
// import { io } from "../socket/socket.js";
// import io from "socket.io-client";



export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        // const { id: receiverId } = req.params.id;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let conversation = await Conversation.findOne({
            participants: {
                $all: [senderId, receiverId]
            }
        })

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            message,
        })

        if (newMessage) {
            conversation.messages.push(newMessage._id);
        }

        // await conversation.save();// save the conversation to the database
        // await newMessage.save(); // save the message to the database

        //this will run both the above statements in parallel
        await Promise.all([conversation.save(), newMessage.save()]);

        // socket io fuction will go here
        const receiverSocketId = getReceiverSocketId(receiverId);

        if (receiverSocketId) {
            // io.to
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }


        res.status(201).json(newMessage);

    } catch (error) {
        console.log("Error in sendMessage controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.user._id;

        const conversation = await Conversation.findOne({
            participants: {
                $all: [senderId, userToChatId]
            }
        }).populate("messages"); //not reference, but actual messages

        if (!conversation) { // if no conversation is found
            return res.status(200).json([]); // return an empty array
        }

        const messages = conversation.messages;
        res.status(200).json(conversation.messages);

    } catch (error) {
        console.log("Error in getMessages controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}  