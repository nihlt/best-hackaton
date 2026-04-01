; ============================================================================
; cube.asm — Ultra-Minimal RAM 3D Rotating Wireframe Cube
; Pure x86-64 NASM for Windows (WinAPI GDI32)
; ============================================================================
bits 64
default rel

; ---- constants ----
%define FP       16
%define FONE     65536
%define SCALE    100
%define DIST     400
%define WW       800
%define WH       600
%define TID      1
%define TMS      16
%define NV       8
%define NE       12

; WinAPI
%define CS_HR    2
%define CS_VR    1
%define WS_OVL   0x00CF0000
%define WS_VIS   0x10000000
%define SW_NORM  1
%define WM_CRE   1
%define WM_DST   2
%define WM_PNT   0x000F
%define WM_TMR   0x0113
%define WM_KEY   0x0100
%define WM_ERASEBKGND 0x0014
%define VK_ESC   0x1B
%define BLACKNESS 0x00000042

; ---- imports ----
extern GetModuleHandleA
extern RegisterClassExA
extern CreateWindowExA
extern ShowWindow
extern UpdateWindow
extern GetMessageA
extern TranslateMessage
extern DispatchMessageA
extern PostQuitMessage
extern DefWindowProcA
extern BeginPaint
extern EndPaint
extern InvalidateRect
extern SetTimer
extern KillTimer
extern GetClientRect
extern SelectObject
extern DeleteObject
extern PatBlt
extern CreatePen
extern MoveToEx
extern LineTo
extern GetSystemMetrics
extern DestroyWindow
extern ExitProcess
extern GetCurrentProcess
extern SetProcessWorkingSetSize

; ============================== DATA =====================================
section .data

szCls:  db "Cube3D", 0
szTtl:  db "Assembly 3D Cube", 0

; 8 vertices 
align 16
verts:
    dd -SCALE*FONE, -SCALE*FONE, -SCALE*FONE
    dd  SCALE*FONE, -SCALE*FONE, -SCALE*FONE
    dd  SCALE*FONE,  SCALE*FONE, -SCALE*FONE
    dd -SCALE*FONE,  SCALE*FONE, -SCALE*FONE
    dd -SCALE*FONE, -SCALE*FONE,  SCALE*FONE
    dd  SCALE*FONE, -SCALE*FONE,  SCALE*FONE
    dd  SCALE*FONE,  SCALE*FONE,  SCALE*FONE
    dd -SCALE*FONE,  SCALE*FONE,  SCALE*FONE

; 12 edges
align 4
edg:
    db 0,1, 1,2, 2,3, 3,0
    db 4,5, 5,6, 6,7, 7,4
    db 0,4, 1,5, 2,6, 3,7

; sin LUT 360 entries
align 16
stab:
    dd 0, 1143, 2287, 3429, 4571, 5711, 6850, 7986, 9120, 10252
    dd 11380, 12504, 13625, 14742, 15854, 16961, 18064, 19160, 20251, 21336
    dd 22414, 23486, 24550, 25606, 26655, 27696, 28729, 29752, 30767, 31772
    dd 32768, 33753, 34728, 35693, 36647, 37589, 38521, 39440, 40347, 41243
    dd 42125, 42995, 43852, 44695, 45525, 46340, 47142, 47929, 48702, 49460
    dd 50203, 50931, 51643, 52339, 53019, 53683, 54331, 54963, 55577, 56175
    dd 56755, 57319, 57864, 58393, 58903, 59395, 59870, 60326, 60763, 61183
    dd 61583, 61965, 62328, 62672, 62997, 63302, 63589, 63856, 64103, 64331
    dd 64540, 64729, 64898, 65047, 65176, 65286, 65376, 65446, 65496, 65526
    dd 65536, 65526, 65496, 65446, 65376, 65286, 65176, 65047, 64898, 64729
    dd 64540, 64331, 64103, 63856, 63589, 63302, 62997, 62672, 62328, 61965
    dd 61583, 61183, 60763, 60326, 59870, 59395, 58903, 58393, 57864, 57319
    dd 56755, 56175, 55577, 54963, 54331, 53683, 53019, 52339, 51643, 50931
    dd 50203, 49460, 48702, 47929, 47142, 46340, 45525, 44695, 43852, 42995
    dd 42125, 41243, 40347, 39440, 38521, 37589, 36647, 35693, 34728, 33753
    dd 32768, 31772, 30767, 29752, 28729, 27696, 26655, 25606, 24550, 23486
    dd 22414, 21336, 20251, 19160, 18064, 16961, 15854, 14742, 13625, 12504
    dd 11380, 10252, 9120, 7986, 6850, 5711, 4571, 3429, 2287, 1143
    dd 0, -1143, -2287, -3429, -4571, -5711, -6850, -7986, -9120, -10252
    dd -11380, -12504, -13625, -14742, -15854, -16961, -18064, -19160, -20251, -21336
    dd -22414, -23486, -24550, -25606, -26655, -27696, -28729, -29752, -30767, -31772
    dd -32768, -33753, -34728, -35693, -36647, -37589, -38521, -39440, -40347, -41243
    dd -42125, -42995, -43852, -44695, -45525, -46340, -47142, -47929, -48702, -49460
    dd -50203, -50931, -51643, -52339, -53019, -53683, -54331, -54963, -55577, -56175
    dd -56755, -57319, -57864, -58393, -58903, -59395, -59870, -60326, -60763, -61183
    dd -61583, -61965, -62328, -62672, -62997, -63302, -63589, -63856, -64103, -64331
    dd -64540, -64729, -64898, -65047, -65176, -65286, -65376, -65446, -65496, -65526
    dd -65536, -65526, -65496, -65446, -65376, -65286, -65176, -65047, -64898, -64729
    dd -64540, -64331, -64103, -63856, -63589, -63302, -62997, -62672, -62328, -61965
    dd -61583, -61183, -60763, -60326, -59870, -59395, -58903, -58393, -57864, -57319
    dd -56755, -56175, -55577, -54963, -54331, -53683, -53019, -52339, -51643, -50931
    dd -50203, -49460, -48702, -47929, -47142, -46340, -45525, -44695, -43852, -42995
    dd -42125, -41243, -40347, -39440, -38521, -37589, -36647, -35693, -34728, -33753
    dd -32768, -31772, -30767, -29752, -28729, -27696, -26655, -25606, -24550, -23486
    dd -22414, -21336, -20251, -19160, -18064, -16961, -15854, -14742, -13625, -12504
    dd -11380, -10252, -9120, -7986, -6850, -5711, -4571, -3429, -2287, -1143

; ============================== BSS ======================================
section .bss

proj:      resd 16        ; 8 projected (sx,sy) pairs
angX:      resd 1
angY:      resd 1
angZ:      resd 1

; handles
g_hwnd:    resq 1
g_hinst:   resq 1
g_pen:     resq 1

; structures
wc_buf:    resb 80
msg_buf:   resb 48
ps_buf:    resb 72
rc_buf:    resb 16

; trig cache
tsinx:     resd 1
tcosx:     resd 1
tsiny:     resd 1
tcosy:     resd 1
tsinz:     resd 1
tcosz:     resd 1
tcx:       resd 1
tcy:       resd 1

; ============================== TEXT =====================================
section .text
global mainCRTStartup

; ========================================================================
; Entry point
; ========================================================================
mainCRTStartup:
    ; Entry: RSP % 16 == 8
    push    rbx              ; RSP % 16 == 0
    sub     rsp, 112         ; 112 bytes for locals/shadow. RSP % 16 == 0.
                             ; 32 (shadow) + 64 (extra stack args for CreateWindow) + 16 (pad) = 112

    xor     ecx, ecx
    call    GetModuleHandleA
    mov     [g_hinst], rax

    ; zero WNDCLASSEXA
    lea     rdi, [wc_buf]
    xor     eax, eax
    mov     ecx, 10
    rep     stosq

    ; fill
    lea     rdi, [wc_buf]
    mov     dword  [rdi+0],  80
    mov     dword  [rdi+4],  CS_HR | CS_VR | 0x0020  ; CS_OWNDC = 0x0020
    lea     rax, [WndProc]
    mov     qword  [rdi+8],  rax
    mov     rax, [g_hinst]
    mov     qword  [rdi+24], rax
    ; hbrBackground = NULL 
    mov     qword  [rdi+48], 0
    lea     rax, [szCls]
    mov     qword  [rdi+64], rax

    lea     rcx, [wc_buf]
    call    RegisterClassExA
    test    eax, eax
    jz      .quit

    ; center window
    xor     ecx, ecx          ; SM_CXSCREEN
    call    GetSystemMetrics
    sub     eax, WW
    shr     eax, 1
    mov     ebx, eax           ; posX

    mov     ecx, 1             ; SM_CYSCREEN
    call    GetSystemMetrics
    sub     eax, WH
    shr     eax, 1
    mov     r12d, eax          ; posY

    ; CreateWindowExA: 12 args
    xor     ecx, ecx
    lea     rdx, [szCls]
    lea     r8,  [szTtl]
    mov     r9d, WS_OVL | WS_VIS
    mov     dword  [rsp+32], ebx      ; arg 5
    mov     dword  [rsp+40], r12d     ; arg 6
    mov     dword  [rsp+48], WW       ; arg 7
    mov     dword  [rsp+56], WH       ; arg 8
    mov     qword  [rsp+64], 0        ; arg 9
    mov     qword  [rsp+72], 0        ; arg 10
    mov     rax, [g_hinst]
    mov     qword  [rsp+80], rax      ; arg 11
    mov     qword  [rsp+88], 0        ; arg 12
    call    CreateWindowExA
    test    rax, rax
    jz      .quit
    mov     [g_hwnd], rax

    mov     rcx, rax
    mov     edx, SW_NORM
    call    ShowWindow

    mov     rcx, [g_hwnd]
    call    UpdateWindow

    ; Radical memory optimization: force clean working set at startup
    call    GetCurrentProcess
    mov     rcx, rax
    mov     rdx, -1
    mov     r8, -1
    call    SetProcessWorkingSetSize

.mloop:
    lea     rcx, [msg_buf]
    xor     edx, edx
    xor     r8d, r8d
    xor     r9d, r9d
    call    GetMessageA
    cmp     eax, 0
    jle     .quit

    lea     rcx, [msg_buf]
    call    TranslateMessage
    lea     rcx, [msg_buf]
    call    DispatchMessageA
    jmp     .mloop

.quit:
    xor     ecx, ecx
    call    ExitProcess

; ========================================================================
; WndProc 
; ========================================================================
%define STK     136           ; 136 % 16 == 8
%define L_SHAD  0
%define L_ARG5  32

%define L_SAV_HW   96
%define L_SAV_MSG  104
%define L_SAV_WP   112
%define L_SAV_LP   120

%define L_X2       128
%define L_Y2       132

WndProc:
    ; Entry: RSP % 16 == 8
    push    rbp              ; RSP % 16 == 0
    push    rbx              ; RSP % 16 == 8
    push    rsi              ; RSP % 16 == 0
    push    rdi              ; RSP % 16 == 8
    push    r12              ; RSP % 16 == 0
    push    r13              ; RSP % 16 == 8
    push    r14              ; RSP % 16 == 0
    push    r15              ; RSP % 16 == 8
                             ; 8 pushes (64 bytes)
    sub     rsp, STK         ; 8 - 136 = -128. -128 % 16 == 0. RSP is 16-ALIGNED.

    mov     [rsp+L_SAV_HW], rcx
    mov     [rsp+L_SAV_MSG], edx
    mov     [rsp+L_SAV_WP], r8
    mov     [rsp+L_SAV_LP], r9
    mov     rbx, rcx

    cmp     edx, WM_CRE
    je      .wc
    cmp     edx, WM_TMR
    je      .wt
    cmp     edx, WM_PNT
    je      .wp
    cmp     edx, WM_KEY
    je      .wk
    cmp     edx, WM_ERASEBKGND
    je      .werase
    cmp     edx, WM_DST
    je      .wd

    ; default
    mov     rcx, rbx
    mov     edx, [rsp+L_SAV_MSG]
    mov     r8,  [rsp+L_SAV_WP]
    mov     r9,  [rsp+L_SAV_LP]
    call    DefWindowProcA
    jmp     .ret

.werase:
    mov     eax, 1
    jmp     .ret

; ---- WM_CREATE ----
.wc:
    mov     rcx, rbx
    mov     edx, TID
    mov     r8d, TMS
    xor     r9, r9
    call    SetTimer

    xor     ecx, ecx
    mov     edx, 2
    mov     r8d, 0x0000FF00
    call    CreatePen
    mov     [g_pen], rax

    xor     eax, eax
    jmp     .ret

; ---- WM_TIMER ----
.wt:
    mov     eax, [angX]
    add     eax, 2
    cmp     eax, 360
    jl      .t1
    sub     eax, 360
.t1: mov    [angX], eax

    mov     eax, [angY]
    add     eax, 3
    cmp     eax, 360
    jl      .t2
    sub     eax, 360
.t2: mov    [angY], eax

    mov     eax, [angZ]
    add     eax, 1
    cmp     eax, 360
    jl      .t3
    sub     eax, 360
.t3: mov    [angZ], eax

    mov     rcx, rbx
    xor     edx, edx
    xor     r8d, r8d
    call    InvalidateRect

    ; Trim Working Set on every frame to force RAM footprint under 500KB
    call    GetCurrentProcess
    mov     rcx, rax
    mov     rdx, -1
    mov     r8, -1
    call    SetProcessWorkingSetSize

    xor     eax, eax
    jmp     .ret

; ---- WM_KEYDOWN ----
.wk:
    mov     r8, [rsp+L_SAV_WP]
    cmp     r8d, VK_ESC
    jne     .wkd
    mov     rcx, rbx
    call    DestroyWindow
    xor     eax, eax
    jmp     .ret
.wkd:
    mov     rcx, rbx
    mov     edx, [rsp+L_SAV_MSG]
    mov     r8,  [rsp+L_SAV_WP]
    mov     r9,  [rsp+L_SAV_LP]
    call    DefWindowProcA
    jmp     .ret

; ---- WM_DESTROY ----
.wd:
    mov     rcx, rbx
    mov     edx, TID
    call    KillTimer
    mov     rcx, [g_pen]
    call    DeleteObject
    xor     ecx, ecx
    call    PostQuitMessage
    xor     eax, eax
    jmp     .ret

; ---- WM_PAINT ----
.wp:
    mov     rcx, rbx
    lea     rdx, [ps_buf]
    call    BeginPaint
    mov     r12, rax               ; hdc

    mov     rcx, rbx
    lea     rdx, [rc_buf]
    call    GetClientRect

    ; PatBlt black (BLACKNESS) directly over the screen HDC to clear it
    mov     rcx, r12
    xor     edx, edx
    xor     r8d, r8d
    mov     r9d, [rc_buf+8]
    mov     r10d, [rc_buf+12]
    mov     dword [rsp+L_ARG5], r10d
    mov     dword [rsp+L_ARG5+8], BLACKNESS
    call    PatBlt

    ; select pen
    mov     rcx, r12
    mov     rdx, [g_pen]
    call    SelectObject
    mov     r13, rax               ; hOldPen

    call    Transform

    ; draw edges
    xor     esi, esi
.el:
    cmp     esi, NE
    jge     .ed

    lea     rax, [edg]
    movzx   ecx, byte [rax + rsi*2]
    movzx   edx, byte [rax + rsi*2 + 1]

    lea     rdi, [proj]
    mov     eax, [rdi + rcx*8]
    mov     r8d, [rdi + rcx*8 + 4]
    mov     r9d, [rdi + rdx*8]
    mov     r10d,[rdi + rdx*8 + 4]

    ; Store destination into locals safely
    mov     [rsp+L_X2], r9d
    mov     [rsp+L_Y2], r10d

    ; MoveToEx(hdc, x1, y1, NULL)
    mov     rcx, r12
    mov     edx, eax
    ; r8d is y1
    xor     r9, r9
    call    MoveToEx

    ; LineTo(hdc, x2, y2)
    mov     rcx, r12
    mov     edx, [rsp+L_X2]
    mov     r8d, [rsp+L_Y2]
    call    LineTo

    inc     esi
    jmp     .el

.ed:
    mov     rcx, r12
    mov     rdx, r13
    call    SelectObject

    mov     rcx, rbx
    lea     rdx, [ps_buf]
    call    EndPaint

    xor     eax, eax

.ret:
    add     rsp, STK
    pop     r15
    pop     r14
    pop     r13
    pop     r12
    pop     rdi
    pop     rsi
    pop     rbx
    pop     rbp
    ret

; ========================================================================
; Transform — rotate 8 vertices, perspective-project to proj[]
; ========================================================================
Transform:
    ; Entry: RSP % 16 == 8.
    push    rbx         ; RSP % 16 == 0
    push    rsi         ; RSP % 16 == 8
    push    rdi         ; RSP % 16 == 0
    push    r12         ; RSP % 16 == 8
    push    r13         ; RSP % 16 == 0
    push    r14         ; RSP % 16 == 8
    push    r15         ; RSP % 16 == 0
    push    rbp         ; RSP % 16 == 8
    sub     rsp, 40     ; RSP % 16 == 0. (8 - 40 = -32, -32%16 == 0). Aligned.

    lea     r12, [stab]

    mov     eax, [angX]
    cdqe
    mov     eax, [r12 + rax*4]
    mov     [tsinx], eax

    mov     eax, [angX]
    add     eax, 90
    cmp     eax, 360
    jl      .cx1
    sub     eax, 360
.cx1: cdqe
    mov     eax, [r12 + rax*4]
    mov     [tcosx], eax

    mov     eax, [angY]
    cdqe
    mov     eax, [r12 + rax*4]
    mov     [tsiny], eax

    mov     eax, [angY]
    add     eax, 90
    cmp     eax, 360
    jl      .cy1
    sub     eax, 360
.cy1: cdqe
    mov     eax, [r12 + rax*4]
    mov     [tcosy], eax

    mov     eax, [angZ]
    cdqe
    mov     eax, [r12 + rax*4]
    mov     [tsinz], eax

    mov     eax, [angZ]
    add     eax, 90
    cmp     eax, 360
    jl      .cz1
    sub     eax, 360
.cz1: cdqe
    mov     eax, [r12 + rax*4]
    mov     [tcosz], eax

    mov     eax, [rc_buf+8]
    shr     eax, 1
    mov     [tcx], eax
    mov     eax, [rc_buf+12]
    shr     eax, 1
    mov     [tcy], eax

    lea     r13, [verts]
    lea     r14, [proj]
    xor     esi, esi

.vl:
    cmp     esi, NV
    jge     .vd

    imul    edi, esi, 12

    movsxd  rax, dword [r13 + rdi]
    mov     ebx, eax
    movsxd  rax, dword [r13 + rdi + 4]
    mov     ecx, eax
    movsxd  rax, dword [r13 + rdi + 8]
    mov     edx, eax

    ; Y rot
    movsxd  rax, ebx
    movsxd  r8, dword [tcosy]
    imul    rax, r8
    sar     rax, FP
    mov     r8d, eax

    movsxd  rax, edx
    movsxd  r9, dword [tsiny]
    imul    rax, r9
    sar     rax, FP
    add     r8d, eax           ; r8d=x1

    movsxd  rax, ebx
    movsxd  r9, dword [tsiny]
    imul    rax, r9
    sar     rax, FP
    neg     eax
    mov     r9d, eax

    movsxd  rax, edx
    movsxd  r10, dword [tcosy]
    imul    rax, r10
    sar     rax, FP
    add     r9d, eax           ; r9d=z1

    mov     ebx, r8d
    mov     edx, r9d

    ; X rot
    movsxd  rax, ecx
    movsxd  r8, dword [tcosx]
    imul    rax, r8
    sar     rax, FP
    mov     r8d, eax

    movsxd  rax, edx
    movsxd  r9, dword [tsinx]
    imul    rax, r9
    sar     rax, FP
    sub     r8d, eax           ; r8d=y1

    movsxd  rax, ecx
    movsxd  r9, dword [tsinx]
    imul    rax, r9
    sar     rax, FP
    mov     r9d, eax

    movsxd  rax, edx
    movsxd  r10, dword [tcosx]
    imul    rax, r10
    sar     rax, FP
    add     r9d, eax           ; r9d=z2

    mov     ecx, r8d
    mov     edx, r9d

    ; Z rot
    movsxd  rax, ebx
    movsxd  r8, dword [tcosz]
    imul    rax, r8
    sar     rax, FP
    mov     r8d, eax

    movsxd  rax, ecx
    movsxd  r9, dword [tsinz]
    imul    rax, r9
    sar     rax, FP
    sub     r8d, eax           ; r8d=x2

    movsxd  rax, ebx
    movsxd  r9, dword [tsinz]
    imul    rax, r9
    sar     rax, FP
    mov     r9d, eax

    movsxd  rax, ecx
    movsxd  r10, dword [tcosz]
    imul    rax, r10
    sar     rax, FP
    add     r9d, eax           ; r9d=y2

    ; perspective
    sar     r8d, FP
    sar     r9d, FP
    sar     edx, FP

    lea     r10d, [rdx + DIST]
    cmp     r10d, 1
    jge     .pok
    mov     r10d, 1
.pok:
    mov     eax, r8d
    imul    eax, DIST
    cdq
    idiv    r10d
    add     eax, [tcx]
    mov     r11d, esi
    shl     r11d, 3
    mov     [r14 + r11], eax

    mov     eax, r9d
    imul    eax, DIST
    cdq
    idiv    r10d
    add     eax, [tcy]
    mov     [r14 + r11 + 4], eax

    inc     esi
    jmp     .vl

.vd:
    add     rsp, 40
    pop     rbp
    pop     r15
    pop     r14
    pop     r13
    pop     r12
    pop     rdi
    pop     rsi
    pop     rbx
    ret
