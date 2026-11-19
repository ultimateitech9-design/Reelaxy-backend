import { Injectable } from '@nestjs/common';

export type ChatbotLanguage = 'en' | 'hi';

@Injectable()
export class ChatbotService {
  shouldSuggestSupport(messageInput: string) {
    const message = messageInput.trim().toLowerCase();
    return /support|human|agent|ticket|refund|charged|payment failed|not working|bug|error|hacked|scam|harass|threat|सपोर्ट|मदद|एजेंट|टिकट|रिफंड|पेमेंट|काम नहीं|हैक|धोखा|परेशान/.test(message);
  }

  reply(messageInput: string, language: ChatbotLanguage) {
    const message = messageInput.trim().toLowerCase();
    const hindi = language === 'hi';

    if (/safety|safe|report|block|suraksha|सुरक्षा|रिपोर्ट|ब्लॉक/.test(message)) {
      return hindi
        ? 'अपनी सुरक्षा के लिए निजी जानकारी साझा न करें। किसी प्रोफ़ाइल या मैसेज को रिपोर्ट/ब्लॉक करने के लिए उसके मेन्यू में Report या Block चुनें।'
        : 'Keep personal information private. To report or block someone, open the profile or message menu and choose Report or Block.';
    }
    if (/match|like|discover|मैच|लाइक/.test(message)) {
      return hindi
        ? 'Discover पेज पर प्रोफ़ाइल पसंद करने के लिए Like करें। जब दोनों लोग एक-दूसरे को Like करते हैं, तो Match बन जाता है।'
        : 'Use Like on the Discover page. A match is created when both people like each other.';
    }
    if (/message|chat|मैसेज|चैट/.test(message)) {
      return hindi
        ? 'Discover में किसी भी प्रोफ़ाइल पर Chat बटन दबाएँ। चैट बिल्कुल फ्री है।'
        : 'Tap Chat on any profile in Discover to start a conversation. Chat is always free.';
    }
    if (/premium|gold|diamond|plan|payment|wallet|coin|recharge|call|डायमंड|गोल्ड|प्लान|पेमेंट|वॉलेट|कॉल/.test(message)) {
      return hindi
        ? 'Reelaxy में एक ही प्लान है: wallet. Likes और chat फ्री हैं। Audio/video call के लिए Wallet पेज से coins recharge करें।'
        : 'Reelaxy has one plan: the wallet. Likes and chat are free. Recharge coins on the Wallet page to make audio and video calls.';
    }
    if (/profile|photo|verify|प्रोफ़ाइल|फोटो|वेरिफ/.test(message)) {
      return hindi
        ? 'Profile सेक्शन में जाकर फोटो, बायो और पसंद अपडेट करें। पूरा और verified प्रोफ़ाइल बेहतर matches पाने में मदद करता है।'
        : 'Open Profile to update photos, bio, and preferences. A complete and verified profile helps you find better matches.';
    }

    return hindi
      ? 'मैं Reelaxy सहायक हूँ। आप मुझसे मैच, मैसेज, प्रोफ़ाइल, सुरक्षा या Gold/Diamond प्लान के बारे में पूछ सकते हैं।'
      : 'I am your Reelaxy assistant. Ask me about matches, chat, calls, profiles, safety, or your wallet.';
  }
}
