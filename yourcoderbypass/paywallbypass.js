var tikfinitySocket = null
async function tikfinityConnection() {
  if (tikfinitySocket) {return}
  console.log("[PATCH] connecting to tikfinity..")
  tikfinitySocket = new WebSocket("ws://localhost:21213/")
  tikfinitySocket.onopen = function () {console.log("[PATCH] connected to tikfinity")}
  tikfinitySocket.onclose = async function () {
    tikfinitySocket = null
    console.log("[PATCH] disconnected from tikfinity, reconnecting in 2s")
    setTimeout(() => {tikfinityConnection()}, 2e3)
  }
  tikfinitySocket.onmessage = function (event) {
    var data = JSON.parse(event.data)
    if (data.event === "chat") {chatEvent(data.data)}
  }
};tikfinityConnection()
function chatEvent(data) {
  var user = {
    username: data.nickname || data.uniqueId || "unknown",
    nickname: data.nickname || data.uniqueId || "unknown",
    uniqueId: data.uniqueId || "",
    photoUrl: data.profilePictureUrl || "",
    followStatus: data.followInfo.followStatus,
    gift_name: "",
    comment: data.comment || "",
  }
  window.Contexto.submitWord(user)
}
