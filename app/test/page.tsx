import { supabase } from "@/lib/supabase";

export default async function TestPage() {
  // 测试 1: 查询所有数据（不带任何条件）
  const { data: allData, error: allError } = await supabase
    .from("bread_shares")
    .select("*");

  // 测试 2: 只查询 published
  const { data: publishedData, error: publishedError } = await supabase
    .from("bread_shares")
    .select("*")
    .eq("status", "published");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase 连接测试</h1>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-bold">测试 1: 查询所有数据</h2>
        {allError ? (
          <p className="text-red-600">错误: {allError.message}</p>
        ) : (
          <div>
            <p className="text-green-600">查到 {allData?.length || 0} 条数据</p>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(allData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-bold">测试 2: 查询 status=published</h2>
        {publishedError ? (
          <p className="text-red-600">错误: {publishedError.message}</p>
        ) : (
          <div>
            <p className="text-green-600">查到 {publishedData?.length || 0} 条数据</p>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(publishedData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
