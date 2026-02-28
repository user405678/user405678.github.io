// tiktokEvents.js
// Handles incoming TikTok events from Chrome extension and routes them to GameManager

// Comment event listener
window.addEventListener("handleRealCommentEvent", function(event) {
    const user = {
      username: event.detail.username,
      nickname: event.detail.nickname,
      uniqueId: event.detail.uniqueId,
      photoUrl: event.detail.photoUrl,
      followStatus: event.detail.followStatus,
      gift_name: event.detail.gift_name || "",
      comment: event.detail.comment,
      eventType: event.detail.eventType,
      tikfinityUsername: event.detail.tikfinityUsername || null
    };
    
    // Pass the guess/comment to GameManager
    GameManager.handleRealComment(user);
  });
  
  // Gift event listener
  window.addEventListener("handleRealGiftEvent", function(event) {
    const user = {
      username: event.detail.username,
      nickname: event.detail.nickname,
      uniqueId: event.detail.uniqueId,
      photoUrl: event.detail.photoUrl,
      giftName: event.detail.giftName,
      diamondCount: event.detail.diamondCount,
      giftCount: event.detail.giftCount,
      comment: event.detail.comment || "",
      eventType: event.detail.eventType
    };
  
    // Pass the gift to GameManager
    GameManager.handleRealGift(user);
  });
  