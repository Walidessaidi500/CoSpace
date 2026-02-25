import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    ElementRef,
    AfterViewChecked,
    ChangeDetectorRef,
    inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService, ChatConversacion, ChatMensaje } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-chat-widget',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chat-widget.component.html',
    styleUrls: ['./chat-widget.component.css']
})
export class ChatWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {

    private chatService = inject(ChatService);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    @ViewChild('messagesContainer') messagesContainer!: ElementRef;

    // Estado del UI
    isChatOpen: boolean = false;
    conversations: ChatConversacion[] = [];
    activeConversationId: number | null = null;
    messages: ChatMensaje[] = [];
    unreadCount: number = 0;
    messageText: string = '';
    isAuthenticated: boolean = false;

    // Info de la conversación activa (para el header)
    activeConvInfo: ChatConversacion | null = null;

    // Subscriptions
    private subs: Subscription[] = [];
    private shouldScrollToBottom = false;
    private lastMessageCount = 0;

    ngOnInit(): void {
        // Verificar autenticación
        const user = this.authService.getUser();
        this.isAuthenticated = !!user;

        if (!this.isAuthenticated) return;

        // Iniciar polling de conversaciones
        this.chatService.startPolling();

        // Suscribirse a los cambios
        this.subs.push(
            this.chatService.isChatOpen$.subscribe(isOpen => {
                this.isChatOpen = isOpen;
                if (isOpen) {
                    this.shouldScrollToBottom = true;
                }
                this.cdr.detectChanges();
            })
        );

        this.subs.push(
            this.chatService.conversations$.subscribe(convs => {
                this.conversations = convs;

                // Actualizar info de la conversación activa
                if (this.activeConversationId) {
                    this.activeConvInfo = convs.find(c => c.id_conv === this.activeConversationId) || null;
                }
                this.cdr.detectChanges();
            })
        );

        this.subs.push(
            this.chatService.activeConversationId$.subscribe(id => {
                this.activeConversationId = id;
                if (id) {
                    this.activeConvInfo = this.conversations.find(c => c.id_conv === id) || null;
                } else {
                    this.activeConvInfo = null;
                }
                this.shouldScrollToBottom = true;
                this.cdr.detectChanges();
            })
        );

        this.subs.push(
            this.chatService.messages$.subscribe(msgs => {
                // Detectar nuevos mensajes para auto-scroll
                if (msgs.length > this.lastMessageCount) {
                    this.shouldScrollToBottom = true;
                }
                this.lastMessageCount = msgs.length;
                this.messages = msgs;
                this.cdr.detectChanges();
            })
        );

        this.subs.push(
            this.chatService.unreadCount$.subscribe(count => {
                this.unreadCount = count;
                this.cdr.detectChanges();
            })
        );
    }

    ngAfterViewChecked(): void {
        if (this.shouldScrollToBottom) {
            this.scrollToBottom();
            this.shouldScrollToBottom = false;
        }
    }

    ngOnDestroy(): void {
        this.chatService.stopPolling();
        this.subs.forEach(s => s.unsubscribe());
    }

    // ========================
    // ACCIONES DEL UI
    // ========================

    toggleChat(): void {
        this.chatService.toggleChat();
    }

    openConversation(conv: ChatConversacion): void {
        this.chatService.setActiveConversation(conv.id_conv);
        this.shouldScrollToBottom = true;
    }

    goBackToList(): void {
        this.chatService.setActiveConversation(null);
    }

    sendMessage(): void {
        if (!this.messageText.trim() || !this.activeConversationId) return;

        const texto = this.messageText.trim();
        this.messageText = '';

        this.chatService.sendMessage(this.activeConversationId, texto).subscribe({
            next: () => {
                this.shouldScrollToBottom = true;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error enviando mensaje:', err);
                // Restaurar texto si falla
                this.messageText = texto;
                this.cdr.detectChanges();
            }
        });
    }

    // ========================
    // UTILIDADES DE FORMATO
    // ========================

    getInitial(name: string): string {
        return name ? name.charAt(0).toUpperCase() : '?';
    }

    formatTime(dateStr: string): string {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `${diffMins} min`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    }

    formatMessageTime(dateStr: string): string {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    // ========================
    // SCROLL
    // ========================

    private scrollToBottom(): void {
        try {
            if (this.messagesContainer) {
                const el = this.messagesContainer.nativeElement;
                el.scrollTop = el.scrollHeight;
            }
        } catch (err) {
            // Silenciar error si el elemento no existe aún
        }
    }
}
