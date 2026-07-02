# Thao tác với user
- Các thao tác với user thường là thao tác cơ bản và bắt buộc phải biết khi làm việc với Linux VPS.
- Thường thì ta sẽ tạo 1 user quản trị (không dùng user root để tránh rủi ro), ví dụ tên là `ci` để sử dụng, sau này muốn sử dụng quyền `root` thì dùng `su -`.

## Một số lệnh cơ bản về user và group
```bash
# Xem thông tin user hiện tại
whoami

# Xem danh sách các group có trong hệ thống
cat /etc/group
cat /etc/group | grep <groupname>

# Xem danh sách các user có trong hệ thống
cat /etc/passwd
cat /etc/passwd | grep <username>

# Xem danh sách group của user hiện tại
groups
groups <username>

# Show danh sách user thật hiện có
awk -F: '$3 >= 1000 {print $1}' /etc/passwd

# Tạo mới 1 user
adduser <username>

# Xóa 1 user
userdel <username>

# Xoá 1 user, xoá luôn folder của user đó
userdel -r <username>

# Đổi password cho user, đổi cho chính user hiện tại
passwd

# Đổi password cho user khác, cần qunyền sudo
sudo passwd <user>

# Thêm 1 user vào 1 group
usermod -aG <groupname> <username>
# Ví dụ:
usermod -aG sudo ci

# Do trong /etc/sudoers
# Có dòng lệnh %sudo   ALL=(ALL:ALL) ALL - Tức nghĩa là tất cả user nào có trong group sudo đều có ALL quyền nên có thể dùng lệnh usermod -aG sudo ci
# Trong các os system khác, có thể có dòng %whell   ALL=(ALL:ALL) ALL thì khi đó sẽ dùng usermod -aG whell ci
# Đó là cách 1 (khuyến cáo)
# Nên mình cũng có thể sử dụng cách 2 là chỉnh sửa file /etc/sudoers -> ci    ALL=(ALL:ALL) ALL
# Nhưng theo mặc định file /etc/sudoers chỉ có quyền mặc định là read cho user và group root
# Bạn phải login vào bằng user root và thay đổi quyền của file, giả sử sudo chmod u+w /etc/sudoers
# Và tiền hành ghi vào file /etc/sudoers -> ci    ALL=(ALL:ALL) ALL
# Sau khi ghi xong, nên cập nhật lại quyền cho file /etc/sudoers, giả sử sudo chmod u-w /etc/sudoers

# Xóa 1 user khỏi 1 group
gpasswd -d <username> <groupname>
# Ví dụ:
gpasswd -d ci sudo

# Switch user
su - <username>
# Ví dụ:
su - ci

# Xem user sử dụng bash hay zsh
echo $SHELL

```

### sudo, chmod, chown, chgrp

```bash
# Xem quyền của file
ls
ls -l
ls -la
ll

ls -l <filename>
ls -la <filename>
ll <filename>

# Ký tự đầu tiên bắt đầu bằng dấu - là file, bắt đầu bằng dấu d là folder, bắt đầu bằng dấu l là symbol link (alias)
# 9 ký tự tiếp theo là quyền của file bao gồm 3 nhóm 3 ký tự
# Nhóm thứ nhất là quyền của user - u
# Nhóm thứ hai là quyền của group - g
# Nhóm thứ ba là quyền của other - o

# Trong đó:
# r: read (nếu tính theo hệ bát phân thì r = 4)
# w: write (nếu tính theo hệ bát phân thì w = 2)
# x: execute (nếu tính theo hệ bát phân thì x = 1)
# -: không có quyền (nếu tính theo hệ bát phân thì - = 0)

# Dùng ký tự r, w, x, a
# Thêm quyền cho user, group, other
chmod u+x <filename>
chmod u+x,g+x,o+x <filename>
chmod a+x <filename>

# Bỏ quyền của user, group, other
chmod u-x <filename>
chmod u-x,g-x,o-x <filename>
chmod a-x <filename>

# Gán quyền cho user, group, other
chmod u=rwx,g=rwx,o=rwx <filename>
chmod a=rwx <filename>

# Gán quyền cho user, group, other
chmod u=rwx,g=rwx,o=rwx <filename>

# Gán quyền cho user, group, other
chmod u=rwx,g=rwx,o=rwx <filename>
chmod a=rwx <filename>

# Dùng hệ bát phân
# Thêm quyền cho user, group, other
chmod <permission> <filename>
# Ví dụ: chmod 755 <filename>

# Bỏ quyền của user, group, other
chmod u-x,g-x,o-x <filename>
# Ví dụ: chmod 000 <filename>
chmod a=000 <filename>

# Thay đổi quyền của folder
chmod -R <permission> <foldername>
# Ví dụ: chmod -R 000 <foldername>
chmod -R a=000 <foldername>
```