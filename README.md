# 🎰 Lottery DApp trên Blockchain IOTA
## Bài tập lớn môn: AN TOÀN VÀ BẢO MẬT THÔNG TIN

---

## 👨‍🎓 Thông tin bài tập lớn

- **Tên đề tài:**  
  Xây dựng ứng dụng Lottery DApp trên nền tảng Blockchain tích hợp ví IOTA

- **Môn học:** An toàn và Bảo mật Thông tin  
- **Loại bài:** Bài tập lớn  
- **Sinh viên thực hiện:**  
  - Lê Đức Duy
  - Phan Minh Trúc

---

## 🎯 Mục tiêu đề tài

Trong bối cảnh các hệ thống tập trung dễ bị:
- Gian lận dữ liệu  
- Can thiệp kết quả  
- Thiếu minh bạch và khó kiểm chứng  

Đề tài này hướng tới việc:
- Ứng dụng **Blockchain** để đảm bảo **tính toàn vẹn (Integrity)** của dữ liệu
- Đảm bảo **tính minh bạch (Transparency)** trong quá trình quay số
- Đảm bảo **xác thực và phân quyền (Authentication & Authorization)** thông qua ví điện tử
- Giảm thiểu rủi ro **tấn công sửa đổi dữ liệu (Tampering)**

---

## 🔐 Ý nghĩa về An toàn & Bảo mật Thông tin

Ứng dụng Lottery DApp đáp ứng các nguyên tắc bảo mật quan trọng:

- **Integrity (Toàn vẹn dữ liệu):**  
  Logic quay số và danh sách người chơi được lưu trữ trực tiếp trên blockchain, không thể chỉnh sửa trái phép.

- **Authentication (Xác thực):**  
  Người dùng đăng nhập và tương tác hệ thống thông qua **IOTA Wallet**.

- **Non-repudiation (Không thể chối bỏ):**  
  Mọi giao dịch đều được ghi nhận trên blockchain và có thể truy vết.

- **Transparency (Minh bạch):**  
  Kết quả quay số có thể kiểm chứng công khai thông qua Explorer.

---
# LOTTERY DAPP

A beginner-friendly Reactjs template for building IOTA dApps with Move smart contracts.
Lottery contract
<img width="1849" height="981" alt="Screenshot 2025-12-07 135200" src="https://github.com/user-attachments/assets/ec571386-694b-4301-8e49-64e16164bb8d" />
## Contract Address
Network: Testnet Package ID : 0x39b376af31f0ea2c6fe9c1fef01ee1a62c7e2f63fe0a98c8de4b1a2a86024d9a

Explorer : [View Contract on IOTA Explorer](https://explorer.iota.org/object/0x39b376af31f0ea2c6fe9c1fef01ee1a62c7e2f63fe0a98c8de4b1a2a86024d9a?network=testnet)

## 🚀 Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Deploy your contract
npm run iota-deploy

# Start development server
npm run dev
```

## 📚 Documentation

For detailed instructions, see **[INSTRUCTION_GUIDE.md](./INSTRUCTION_GUIDE.md)**

## 🎯 Features

- ✅ Wallet connection with IOTA dApp Kit
- ✅ Move smart contract integration
- ✅ TypeScript support
- ✅ Modern UI with Radix UI
- ✅ Automated deployment and integration
- ✅ Error handling and loading states

## 📁 Project Structure

```
├── app/           
├── components/     
├── hooks/          
├── lib/           
└── contract/       
```

## 📚 Learn More

- [IOTA Documentation](https://wiki.iota.org/)
- [IOTA dApp Kit](https://github.com/iotaledger/dapp-kit)
- [Next.js Documentation](https://nextjs.org/docs)

## 📄 License

MIT
