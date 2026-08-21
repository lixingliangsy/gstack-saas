// 测试脚本：验证 Waffo webhook 处理逻辑
import { applyPurchaseToUser, planFromProductId } from "./lib/subscriptions";
import { findByEmail } from "./lib/users";
import { PRODUCT } from "./lib/product";

async function main() {
  console.log("=== Waffo Webhook 支付回调测试 ===\n");

  // 1. 检查产品 ID 映射
  const proProductId = PRODUCT.pricing.find((t) => t.id === "pro")?.waffoProductId?.monthly;
  console.log("1. Pro 套餐 Waffo 产品 ID:", proProductId);
  
  const plan = planFromProductId(proProductId);
  console.log("   产品 ID 映射到套餐:", plan);

  // 2. 查找测试用户
  const testEmail = "test+gstack+tester001@example.com";
  const user = await findByEmail(testEmail);
  console.log("\n2. 测试用户:", user ? { id: user.id, email: user.email, plan: user.plan } : "未找到");

  if (!user) {
    console.error("错误：测试用户不存在");
    process.exit(1);
  }

  console.log("   当前套餐:", user.plan);

  // 3. 模拟 webhook 回调，应用购买到用户
  console.log("\n3. 模拟 webhook 处理...");
  const result = await applyPurchaseToUser(testEmail, proProductId);
  console.log("   applyPurchaseToUser 返回:", result);

  // 4. 验证用户套餐已更新
  const updatedUser = await findByEmail(testEmail);
  console.log("\n4. 验证更新后的用户套餐:", updatedUser?.plan);
  
  if (updatedUser?.plan === "pro") {
    console.log("   成功！用户套餐已更新为 pro");
  } else {
    console.log("   失败！用户套餐未更新");
  }

  console.log("\n=== 测试完成 ===");
}

main().catch(console.error);
