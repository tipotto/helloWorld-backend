export default interface Message {
  id: string;
  chatRoomId: string;
  senderName: string;
  senderId: string;
  senderLang: string;
  senderInitials: string;
  type: string;
  status: string;
  readCounter: number;
  message: string;
  audioUrl: string;
  videoUrl: string;
  pictureUrl: string;
  latitude: number;
  longitude: number;
  audioDuration: number;
  date: any;
  readDate: any;
}
