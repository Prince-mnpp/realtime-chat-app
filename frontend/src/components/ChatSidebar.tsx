'use client'

import { User } from '@/context/AppContext';
import { Link, LogOut, MessageCircle, Plus, Search, UserCircle, X } from 'lucide-react';
import React, { useState } from 'react';

interface ChatSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showAllUsers: boolean;
  setShowAllUsers: (show: boolean | ((prev: boolean) => boolean)) => void;
  users: User[] | null;
  loggedInUser: User | null;
  chats: any[] | null;
  selectedUser: string | null;
  setSelectedUser: (userId: string | null) => void;
  handleLogout: () => void;
  createChat: (user: User) => void;
  // onlineUsers: string[];
}

const ChatSidebar = ({
  sidebarOpen,
  setShowAllUsers,
  setSidebarOpen,
  showAllUsers,
  users,
  loggedInUser,
  chats,
  selectedUser,
  setSelectedUser,
  handleLogout,
  createChat,
}: ChatSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  return (
    <aside className={`fixed z-20 sm:static top-0 left-0 h-screen w-80 bg-gray-900 border-r border-gray-700 transform ${
      sidebarOpen ? "translate-x-0" : 
        "-translate-x-full"
    } 
      sm:translate-x-0 transition-transform duration-300 flex flex-col
      `}>
        {/* header */}
        <div className='p-6 border-b border-gray-700'>
          <div className='sm:hidden flex justify-end mb-0'>
            <button onClick={() => setSidebarOpen(false)} className='p-2 hover:bg-gray-700 rounded-lg transition-colors'>
              <X className='w-5 h-5 text-gray-300'/>
            </button>
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-blue-600 justify-between'>
                <MessageCircle className='w-5 h-5 text-white'/>
              </div>

              <h2 className='text-xl font-bold text-white'>{showAllUsers ? "New Chat" : "Messages"}</h2>
            </div>

            <button className={`p-2.5 rounded-lg transition-colors ${
              showAllUsers ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
            }`} onClick={() => setShowAllUsers((prev) => !prev)}>
              {showAllUsers ? (
                <X className='w-4 h-4'/>
              ) : (
                <Plus className='w-4 h-4'/>
              )}
            </button>
          </div>
        </div>

        {/* content to display */}
        <div className='flex-1 overflow-hidden px-4 py-2'>
              {showAllUsers ? (
                <div>
                  <div>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400'/>
                    <input 
                      type="text" 
                      placeholder='Search Users...'
                      className='w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-400'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      id="" 
                    />
                  </div>

                  {/* users List */}
                  <div className='space-y-2 overflow-y-auto h-full pb-4'>
                    {users
                      ?.filter(
                        (u) => 
                          u._id !== loggedInUser?._id &&
                          u.name
                            .toLowerCase()
                            .includes(searchQuery.toLocaleLowerCase())
                      )
                      .map((u) => (
                        <button
                          key={u._id}
                          className='w-full text-left p-4 rounded-lg border border-gray-700
                          hover:border-gray-600 hover:bg-gray-800 transition-colors'
                          onClick={() => createChat(u)}
                        >
                          <div className='flex items-center gap-3'>
                            <div className='relative'>
                              <UserCircle className='w-6 h-6 text-gray-300'/>
                              <span className='absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-gray-900'/>
                            </div>

                            <div className='flex-1 min-w-0'>
                              <span className='font-medium text-white'>{u.name}</span>

                              <div className='text-xs text-gray-400 mt-0.5'>
                                Online
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                      }
                  </div>
                </div>
              ) : chats && chats.length > 0 ? (
                <div className='space-y-2 overflow-y-auto h-full pb-4'>
                  {chats.map((chat) => {
                    const latestMessage = chat.chat.latestMessage;
                    const isSelected = selectedUser === chat.chat._id;

                    const isSentByMe = latestMessage?.sender === loggedInUser?._id;

                    const unseenCount = chat.chat.unseenCount || 0;

                    return (
                      <button
                        key={chat.chat._id}
                        onClick={() => {
                          setSelectedUser(chat.chat._id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left p-4 rounded-lg transition-colors ${
                          isSelected
                            ? "bg-blue-600 border border-blue-500"
                            : "border border-gray-700 hover:border-gray-600"
                        }`}
                      >
                        <div className='flex items-center gap-3'>
                          <div className='relative'>
                            <div className='w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center'>
                              <UserCircle className='w-7 h-7 text-gray-300'/>
                            </div>

                            <span className='absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-gray-900'/>
                          </div>

                          <div>
                            <div>
                              <span>

                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center h-full text-center'>
                  <div className=''>
                    <MessageCircle className='w-8 h-8 text-gray-400'/>
                  </div>
                  <p className='text-gray-400 font-medium'>No Conversation yet</p>
                  <p className='text-sm text-gray-500 mt-1'>Start a new Chat to begin messaging</p>
                </div>
              )}
        </div>

        {/* footer */}

        <div>
          <Link
            href={"/profile"}
            className='flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors'
          >
              <div className='p-1.5 bg-gray-700 rounded-lg'>
                <UserCircle className='w-4 h-4 text-gray-300'/>
              </div>
              <span className='font-medium text-gray-300'>
                Profile
              </span>
          </Link>

          <button
            onClick={handleLogout}
            className='w-full flex items'
          >
            <div className='p-1.5 bg-red-600 rounded-lg'>
              <LogOut className='w-4 h-4 text-gray-300'/>
            </div>
          </button>
        </div>
    </aside>
  )
}

export default ChatSidebar;
