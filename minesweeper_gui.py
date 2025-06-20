import tkinter as tk
from tkinter import messagebox
import random

class Minesweeper:
    def __init__(self, master, size=9, mines=10):
        self.master = master
        self.size = size
        self.mines = mines
        self.buttons = [[None for _ in range(size)] for _ in range(size)]
        self.board = [[0 for _ in range(size)] for _ in range(size)]
        self.revealed = [[False for _ in range(size)] for _ in range(size)]
        self.flags = [[False for _ in range(size)] for _ in range(size)]
        self.game_over = False
        self.create_widgets()
        self.place_mines()
        self.update_numbers()

    def create_widgets(self):
        # 상단에 새 게임 버튼과 정보 표시
        info_frame = tk.Frame(self.master)
        info_frame.grid(row=0, column=0, columnspan=self.size, pady=5)
        
        self.mines_label = tk.Label(info_frame, text=f"지뢰: {self.mines}", font=('Arial', 12))
        self.mines_label.pack(side=tk.LEFT, padx=10)
        
        new_game_btn = tk.Button(info_frame, text="새 게임", command=self.new_game, font=('Arial', 12))
        new_game_btn.pack(side=tk.LEFT, padx=10)
        
        # 게임 보드 생성
        game_frame = tk.Frame(self.master)
        game_frame.grid(row=1, column=0, columnspan=self.size)
        
        for x in range(self.size):
            for y in range(self.size):
                btn = tk.Button(game_frame, width=3, height=1, font=('Arial', 12, 'bold'),
                                command=lambda x=x, y=y: self.on_left_click(x, y),
                                bg='lightgray', relief=tk.RAISED)
                btn.bind('<Button-3>', lambda e, x=x, y=y: self.on_right_click(x, y))
                btn.grid(row=x, column=y, padx=1, pady=1)
                self.buttons[x][y] = btn

    def place_mines(self):
        count = 0
        while count < self.mines:
            x, y = random.randint(0, self.size-1), random.randint(0, self.size-1)
            if self.board[x][y] != -1:
                self.board[x][y] = -1
                count += 1

    def update_numbers(self):
        for x in range(self.size):
            for y in range(self.size):
                if self.board[x][y] == -1:
                    continue
                count = 0
                for dx in [-1, 0, 1]:
                    for dy in [-1, 0, 1]:
                        if dx == 0 and dy == 0:
                            continue
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < self.size and 0 <= ny < self.size:
                            if self.board[nx][ny] == -1:
                                count += 1
                self.board[x][y] = count

    def on_left_click(self, x, y):
        if self.game_over or self.flags[x][y] or self.revealed[x][y]:
            return
            
        if self.board[x][y] == -1:
            self.buttons[x][y].config(text='💣', bg='red', fg='black')
            self.reveal_all_mines()
            self.game_over = True
            messagebox.showinfo("게임 오버", "지뢰를 밟았습니다!")
        else:
            self.reveal(x, y)
            if self.check_win():
                self.game_over = True
                messagebox.showinfo("승리", "축하합니다! 모든 지뢰를 피했습니다!")

    def on_right_click(self, x, y):
        if self.game_over or self.revealed[x][y]:
            return
            
        if not self.flags[x][y]:
            self.buttons[x][y].config(text='🚩', fg='red', bg='lightgray')
            self.flags[x][y] = True
        else:
            self.buttons[x][y].config(text='', fg='black', bg='lightgray')
            self.flags[x][y] = False

    def reveal(self, x, y):
        if self.revealed[x][y] or self.flags[x][y] or x < 0 or x >= self.size or y < 0 or y >= self.size:
            return
            
        self.revealed[x][y] = True
        self.buttons[x][y].config(relief=tk.SUNKEN, bg='white', state=tk.DISABLED)
        
        if self.board[x][y] > 0:
            self.buttons[x][y].config(text=str(self.board[x][y]), fg=self.get_color(self.board[x][y]))
        else:
            self.buttons[x][y].config(text='')
            # 빈 칸이면 주변 칸들도 자동으로 열기
            for dx in [-1, 0, 1]:
                for dy in [-1, 0, 1]:
                    if dx == 0 and dy == 0:
                        continue
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < self.size and 0 <= ny < self.size:
                        self.reveal(nx, ny)

    def reveal_all_mines(self):
        for x in range(self.size):
            for y in range(self.size):
                if self.board[x][y] == -1 and not self.flags[x][y]:
                    self.buttons[x][y].config(text='💣', bg='red')
                elif self.board[x][y] != -1 and self.flags[x][y]:
                    self.buttons[x][y].config(text='❌', bg='yellow')

    def check_win(self):
        for x in range(self.size):
            for y in range(self.size):
                if self.board[x][y] != -1 and not self.revealed[x][y]:
                    return False
        return True

    def get_color(self, num):
        colors = {
            1: 'blue', 
            2: 'green', 
            3: 'red', 
            4: 'purple', 
            5: 'maroon', 
            6: 'turquoise', 
            7: 'black', 
            8: 'gray'
        }
        return colors.get(num, 'black')

    def new_game(self):
        self.game_over = False
        self.board = [[0 for _ in range(self.size)] for _ in range(self.size)]
        self.revealed = [[False for _ in range(self.size)] for _ in range(self.size)]
        self.flags = [[False for _ in range(self.size)] for _ in range(self.size)]
        
        # 모든 버튼 초기화
        for x in range(self.size):
            for y in range(self.size):
                self.buttons[x][y].config(
                    text='', 
                    bg='lightgray', 
                    fg='black',
                    relief=tk.RAISED,
                    state=tk.NORMAL
                )
        
        self.place_mines()
        self.update_numbers()

def create_difficulty_window():
    def start_game(size, mines):
        difficulty_window.destroy()
        root = tk.Tk()
        root.title("지뢰찾기")
        root.resizable(False, False)
        game = Minesweeper(root, size=size, mines=mines)
        root.mainloop()
    
    difficulty_window = tk.Tk()
    difficulty_window.title("난이도 선택")
    difficulty_window.geometry("300x200")
    difficulty_window.resizable(False, False)
    
    tk.Label(difficulty_window, text="난이도를 선택하세요", font=('Arial', 14)).pack(pady=20)
    
    tk.Button(difficulty_window, text="초급 (9x9, 지뢰 10개)", 
              command=lambda: start_game(9, 10), 
              font=('Arial', 12), width=25, pady=5).pack(pady=5)
    
    tk.Button(difficulty_window, text="중급 (16x16, 지뢰 40개)", 
              command=lambda: start_game(16, 40), 
              font=('Arial', 12), width=25, pady=5).pack(pady=5)
    
    tk.Button(difficulty_window, text="고급 (16x30, 지뢰 99개)", 
              command=lambda: start_game(16, 99), 
              font=('Arial', 12), width=25, pady=5).pack(pady=5)
    
    difficulty_window.mainloop()

if __name__ == "__main__":
    create_difficulty_window() 