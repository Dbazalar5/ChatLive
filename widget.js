function loadSocket(callback) {
  const script = document.createElement("script");
  script.src = "https://cdn.socket.io/4.7.2/socket.io.min.js";
  script.onload = callback;
  document.head.appendChild(script);
}

(function () {
  const API_URL = "https://apischats.kingtechlocal.biz";
  const SOCKET_URL = "https://socket.kingtechlocal.biz";
  let platform_id = 1;

  // ===== BOTÓN FLOTANTE =====
  const button = document.createElement("div");
  button.innerText = "💬 Soporte";
  Object.assign(button.style, {
    position: "fixed", bottom: "20px", right: "20px", background: "#16a34a",
    color: "white", padding: "12px 18px", borderRadius: "30px", cursor: "pointer",
    zIndex: "9998", fontFamily: "Arial", boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
  });
  document.body.appendChild(button);

  // ===== MODAL WIDGET =====
  const modal = document.createElement("div");
  Object.assign(modal.style, {
    position: "fixed", bottom: "80px", right: "20px", width: "350px", height: "500px",
    background: "white", borderRadius: "12px", boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
    display: "none", flexDirection: "column", overflow: "hidden", zIndex: "9998", fontFamily: "Arial",
  });

  modal.innerHTML = `
    <div style="background:#16a34a;color:white;padding:12px;display:flex;justify-content:space-between;align-items:center;">
      <span>Soporte en línea</span>
      <button id="close-widget-btn" style="background:transparent;border:none;color:white;cursor:pointer;font-size:16px;">✖</button>
    </div>
    <div id="widget-body" style="flex:1;padding:15px;overflow:auto;display:flex;flex-direction:column;">
      <form id="start-chat-form">
        <input placeholder="Nombre" required name="nombre" style="width:100%;margin-bottom:10px;padding:8px;box-sizing:border-box;" />
        <input placeholder="Correo" required name="correo" style="width:100%;margin-bottom:10px;padding:8px;box-sizing:border-box;" />
        <input placeholder="DNI" required name="dni" style="width:100%;margin-bottom:10px;padding:8px;box-sizing:border-box;" />
        <input placeholder="Player ID (opcional)" name="player_id" style="width:100%;margin-bottom:10px;padding:8px;box-sizing:border-box;" />
        <button type="submit" style="width:100%;padding:10px;background:#16a34a;color:white;border:none;border-radius:4px;cursor:pointer;">
          Ingresar al Chat
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  button.onclick = () => modal.style.display = modal.style.display === "none" ? "flex" : "none";
  document.getElementById("close-widget-btn").onclick = () => modal.style.display = "none";

  // ===== ZOOM MODAL =====
  window.openZoomModal = function(url) {
    const zoomModal = document.createElement("div");
    Object.assign(zoomModal.style, {
      position: "fixed", inset: "0", background: "rgba(0,0,0,0.85)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: "10000", padding: "20px"
    });
    
    const relativeContainer = document.createElement("div");
    relativeContainer.style.position = "relative";
    
    const closeBtn = document.createElement("button");
    closeBtn.innerText = "✖";
    Object.assign(closeBtn.style, {
      position: "absolute", top: "-15px", right: "-15px", background: "#374151", color: "white",
      borderRadius: "50%", width: "30px", height: "30px", border: "1px solid #4b5563", cursor: "pointer", zIndex: "10001"
    });
    
    const img = document.createElement("img");
    img.src = url;
    let currentScale = 1;
    Object.assign(img.style, {
      maxWidth: "100%", maxHeight: "90vh", borderRadius: "8px", transition: "transform 0.2s ease", cursor: "zoom-in"
    });
    
    img.onclick = (e) => {
      e.stopPropagation();
      currentScale = currentScale === 1 ? 2 : currentScale === 2 ? 3 : 1;
      img.style.maxHeight = currentScale > 1 ? "none" : "90vh";
      img.style.maxWidth = currentScale > 1 ? "none" : "100%";
      img.style.transform = `scale(${currentScale})`;
    };
    
    closeBtn.onclick = () => document.body.removeChild(zoomModal);
    zoomModal.onclick = (e) => { if (e.target === zoomModal) document.body.removeChild(zoomModal); };
    
    relativeContainer.appendChild(closeBtn);
    relativeContainer.appendChild(img);
    zoomModal.appendChild(relativeContainer);
    document.body.appendChild(zoomModal);
  };

  // ===== INICIAR CHAT / RECUPERAR =====
  document.addEventListener("submit", async function (e) {
    if (e.target.id !== "start-chat-form") return;
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
      platform_id, nombre: formData.get("nombre"), correo: formData.get("correo"),
      dni: formData.get("dni"), player_id: formData.get("player_id") || null,
    };

    try {
      const res = await fetch(`${API_URL}/api/client/start-chat`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });

      const result = await res.json();
      const conversationId = result.conversation_id;

      // HTML del Chat, Preview y la Encuesta Oculta
      document.getElementById("widget-body").innerHTML = `
        <div style="display:flex;flex-direction:column;height:100%;">
          <div style="font-size:13px;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:5px;">
            <p style="color:#111827;margin:0 0 4px 0;"><strong>ID Conversación:</strong> #${conversationId}</p>
            <p style="color:#111827;margin:0 0 4px 0;"><strong>Estado:</strong> 
              <span id="chat-status" style="color: #ca8a04; font-weight: bold;">${result.estado}</span>
            </p>
          </div>
          
          <div id="chat-messages" style="flex:1;overflow-y:auto;margin-bottom:10px;display:flex;flex-direction:column;gap:8px;"></div>
          <div id="typing-indicator" style="font-size:12px;color:gray;min-height:16px;margin-bottom:4px;"></div>
          
          <div id="preview-container" style="display:none; position:relative; margin-bottom:10px; border:1px solid #ccc; padding:5px; border-radius:4px; background:#f9fafb; width:max-content;">
            <button id="cancel-preview-btn" style="position:absolute; top:-8px; right:-8px; background:#ef4444; color:white; border:none; border-radius:50%; width:20px; height:20px; font-size:10px; cursor:pointer;">✖</button>
            <img id="preview-img" style="max-height:80px; border-radius:4px; display:none;" />
            <div id="preview-pdf" style="display:none; color:#2563eb; font-size:12px;">📄 Documento</div>
          </div>

          <div id="chat-input-container" style="display:flex;gap:5px;align-items:center;">
            <input type="file" id="chat-file" accept="image/*,.pdf" style="display:none;" />
            <label for="chat-file" style="background:#4b5563;color:white;padding:8px 12px;border-radius:4px;cursor:pointer;margin:0;">📎</label>
            <input id="chat-input" placeholder="Mensaje..." style="flex:1;padding:8px;border:1px solid #ccc;border-radius:4px;" />
            <button id="chat-send" style="background:#16a34a;color:white;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;">Enviar</button>
          </div>

          <!-- CONTENEDOR DE ENCUESTA -->
          <div id="survey-container" style="display:none; text-align:center; padding:15px; background:#f9fafb; border-radius:8px; margin-top:10px; border: 1px solid #e5e7eb;">
            <p style="margin:0 0 5px 0;font-weight:bold;color:#111827; font-size:15px;">El chat ha sido finalizado</p>
            <p style="margin:0 0 10px 0;font-size:12px;color:#4b5563;">Por favor, califica nuestra atención del 1 al 5:</p>
            <div id="stars-container" style="font-size:32px; cursor:pointer; color:#d1d5db; display:flex; justify-content:center; gap:8px;">
               <span data-val="1">★</span><span data-val="2">★</span><span data-val="3">★</span><span data-val="4">★</span><span data-val="5">★</span>
            </div>
            <p id="survey-thank-you" style="display:none; margin-top:10px; color:#16a34a; font-weight:bold;">¡Gracias por calificarnos!</p>
          </div>
        </div>
      `;

      let currentFile = null; let currentFileUrl = null;
      const previewContainer = document.getElementById("preview-container");
      const previewImg = document.getElementById("preview-img");
      const previewPdf = document.getElementById("preview-pdf");
      const inputUpload = document.getElementById("chat-file");
      const inputChat = document.getElementById("chat-input");

      function showPreview(file) {
        currentFile = file; previewContainer.style.display = "block";
        if (file.type.startsWith("image/")) {
          currentFileUrl = URL.createObjectURL(file);
          previewImg.src = currentFileUrl; previewImg.style.display = "block"; previewPdf.style.display = "none";
        } else {
          previewImg.style.display = "none"; previewPdf.style.display = "block";
        }
      }

      function clearPreview() {
        currentFile = null; if (currentFileUrl) URL.revokeObjectURL(currentFileUrl); currentFileUrl = null;
        previewContainer.style.display = "none"; previewImg.src = ""; inputUpload.value = "";
      }

      document.getElementById("cancel-preview-btn").onclick = clearPreview;
      inputUpload.addEventListener("change", (e) => { if (e.target.files[0]) showPreview(e.target.files[0]); });
      inputChat.addEventListener("paste", (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
           if (items[i].type.indexOf("image") !== -1) { showPreview(items[i].getAsFile()); e.preventDefault(); break; }
        }
      });

      // ===== SOCKET Y RENDERIZADO =====
      loadSocket(async () => {
        const socket = io(SOCKET_URL);
        socket.emit("join_conversation", conversationId);

        const renderMessage = (data) => {
          const container = document.getElementById("chat-messages");
          const div = document.createElement("div");

          div.style.padding = "8px 12px"; div.style.borderRadius = "12px"; div.style.maxWidth = "80%";
          div.style.wordBreak = "break-word"; div.style.fontSize = "14px"; div.style.lineHeight = "1.4";

          if (data.sender_type === "client") {
            div.style.background = "#e5e7eb"; div.style.color = "#111827";
            div.style.alignSelf = "flex-end"; div.style.borderBottomRightRadius = "2px";
          } else {
            div.style.background = "#16a34a"; div.style.color = "white";
            div.style.alignSelf = "flex-start"; div.style.borderBottomLeftRadius = "2px";
          }

          const msg = data.mensaje || "";
          if (msg.endsWith(".png") || msg.endsWith(".jpg") || msg.endsWith(".jpeg") || msg.endsWith(".webp")) {
            const fullUrl = msg.startsWith("http") ? msg : `${API_URL}${msg}`;
            div.innerHTML = `<img src="${fullUrl}" style="max-width:100%; border-radius:8px; display:block; cursor:zoom-in;" onclick="openZoomModal('${fullUrl}')" />`;
          } else if (msg.endsWith(".pdf")) {
            const fullUrl = msg.startsWith("http") ? msg : `${API_URL}${msg}`;
            div.innerHTML = `<a href="${fullUrl}" target="_blank" style="color:${data.sender_type === 'client' ? '#2563eb' : '#fff'};font-weight:bold;text-decoration:underline;">📄 Ver Documento PDF</a>`;
          } else {
            div.innerText = msg;
          }
          container.appendChild(div);
          container.scrollTop = container.scrollHeight;
        };

        socket.on("new_message", renderMessage);

        socket.on("typing", (data) => {
          if (data.sender_type === "agent") {
            document.getElementById("typing-indicator").innerText = "Asesor está escribiendo...";
            setTimeout(() => document.getElementById("typing-indicator").innerText = "", 2000);
          }
        });

        socket.on("conversation_assigned", (data) => {
          document.getElementById("chat-status").innerText = "ASSIGNED";
          document.getElementById("chat-status").style.color = "#16a34a";
        });

        // ACTIVA LA ENCUESTA AL CERRAR Y OCULTA EL INPUT
        socket.on("chat_closed", (data) => {
           document.getElementById("chat-status").innerText = "CERRADO";
           document.getElementById("chat-status").style.color = "#ef4444";
           // Desaparece todo el form
           document.getElementById("chat-input-container").style.display = "none";
           if (document.getElementById("preview-container")) {
               document.getElementById("preview-container").style.display = "none";
           }
           // Muestra la encuesta
           document.getElementById("survey-container").style.display = "block";
           
           // Hace scroll down automático
           const container = document.getElementById("chat-messages");
           container.scrollTop = container.scrollHeight;
        });

        // RECUPERAR HISTÓRICO SI FUE RESUMIDO
        if (result.resumed) {
          try {
            const historyRes = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`);
            const msgs = await historyRes.json();
            msgs.forEach(m => renderMessage(m));
          } catch(e) { console.error("Error cargando historial", e); }
        }

        /* LÓGICA DE ENCUESTA (Click en las estrellas) */
        const stars = document.querySelectorAll("#stars-container span");
        stars.forEach(star => {
           star.onclick = async (e) => {
              const val = e.target.getAttribute("data-val");
              // Colorear de amarillo hasta la seleccionada
              stars.forEach(s => {
                 s.style.color = s.getAttribute("data-val") <= val ? "#eab308" : "#d1d5db";
                 s.style.pointerEvents = "none"; // Evita múltiples clics (solo votan 1 vez)
              });
              // Enviar rating a backend
              await fetch(`${API_URL}/api/client/conversations/${conversationId}/survey`, {
                 method: "POST", headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ rating: val })
              });
              
              // Mostrar gracias
              document.getElementById("survey-thank-you").style.display = "block";
           };
        });

        // ENVÍO DE MENSAJE
        const sendTextMessage = async (mensaje) => {
          if(!mensaje) return;
          await fetch(`${API_URL}/api/client/conversations/${conversationId}/message`, {
             method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mensaje }),
          });
        };

        const handleInteractiveSend = async () => {
          const mensajeTexto = inputChat.value.trim();
          if (!mensajeTexto && !currentFile) return;
          let fileUrl = null;

          if (currentFile) {
            const btn = document.getElementById("chat-send");
            btn.innerText = "⏳"; btn.disabled = true;
            const formMedia = new FormData(); formMedia.append("file", currentFile);
            
            try {
              const res = await fetch(`${API_URL}/api/upload`, { method: "POST", body: formMedia });
              const dataMedia = await res.json();
              if (dataMedia.success) fileUrl = dataMedia.url;
            } catch (err) {}
            btn.innerText = "Enviar"; btn.disabled = false;
          }

          if (fileUrl) await sendTextMessage(fileUrl);
          if (mensajeTexto) await sendTextMessage(mensajeTexto);

          inputChat.value = ""; clearPreview();
        };

        document.getElementById("chat-send").onclick = handleInteractiveSend;
        inputChat.addEventListener("keypress", (e) => { if (e.key === "Enter") handleInteractiveSend(); });
        inputChat.addEventListener("input", () => socket.emit("typing", { conversationId, sender_type: "client" }));
      });

    } catch (err) { alert("Error al iniciar el chat"); }
  });
})();
