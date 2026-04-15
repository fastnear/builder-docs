# API / RPC 中文术语翻译风格指南

## 核心结论

中文 API / RPC 文档没有一个唯一、绝对统一的术语标准。成熟文档的共同规律是：

- 概念层翻译成中文。
- 协议层、代码层、线上令牌保持英文原样。
- 同一概念允许存在多个中文变体，但一个产品内部必须选定 house style 并保持一致。

一句话版本：**翻译说明，不翻译 wire token。**

## 总原则

1. **翻译概念，不翻译线上令牌。**
   - 保留：`GET`、`POST`、`Content-Type`、`Location`、`Authorization`、`RequestId`、`error_code`、`service`、`rpc`、`message`、`oneof`、`stream`、`201 Created`、`DEADLINE_EXCEEDED`。
   - 翻译：这些 token 周围的说明文字。

2. **把“调用 / 请求 / 消息 / 请求体”分开。**
   - `call` / `invoke` -> 调用
   - `request` / `response` -> 请求 / 响应
   - `message` -> 消息
   - `body` -> 请求体 / 响应体
   - `payload` -> 有效载荷（只在偏协议语境里用）

3. **把“字段”和“参数”分开。**
   - `.proto`、JSON 结构、请求/响应模型里用“字段”。
   - query/path/header/body 传参位置里用“参数”。

4. **把 `deadline` 和 `timeout` 分开。**
   - `deadline` -> 截止时间（绝对时间点）
   - `timeout` -> 超时时间 / 超时设置（时长）

5. **把“状态码”和“错误码”分开。**
   - `HTTP status code` / `gRPC status code` -> 状态码
   - `error_code` / 业务层错误 -> 错误码

6. **不要本地化标识符。**
   - JSON 字段名、Header 名、枚举名、状态常量、示例代码里的标识符保持原样。

## 推荐词表

### 核心概念

| English | 推荐中文 | 说明 |
|---|---|---|
| API | API | 首次出现可补“应用程序编程接口” |
| RPC / gRPC | RPC / gRPC | 首次出现可补“远程过程调用” |
| call / invoke | 调用 | 不要和 request 混成“请求” |
| request / response | 请求 / 响应 | 传输层术语 |
| service | 服务 | gRPC / protobuf 语境 |
| method | 方法 | gRPC 方法 |
| operation | 操作 | REST / 云 API 操作 |
| message | 消息 | protobuf / gRPC message |
| field | 字段 | schema、message、JSON 结构 |
| parameter | 参数 | query/path/header/body 传参 |
| type / type name | 类型 / 类型名 | 代码中的 type token 保留英文 |

### gRPC / Protobuf

| English | 推荐中文 | 说明 |
|---|---|---|
| unary | 一元 | |
| server streaming | 服务端流式 RPC | 可接受变体：服务器流式处理 |
| client streaming | 客户端流式 RPC | 可接受变体：客户端流式处理 |
| bidirectional streaming | 双向流式 RPC | 可接受变体：双向流式处理 |
| stub | 存根 | 首次可写“客户端存根（stub）” |
| channel | 通道 | |
| metadata | 元数据 | |
| interceptor | 拦截器 | 不建议作为 house term 用“侦听器” |
| deadline | 截止时间 | 绝对时间点 |
| timeout | 超时时间 / 超时设置 | 时长 |
| cancellation | 取消 | |
| retry | 重试 | |
| enum | 枚举 | |
| oneof | `oneof` / 互斥字段组 | 代码中保留 `oneof` |
| map | `map` / 映射字段 | 代码中保留 `map` |
| repeated | `repeated` / 重复字段 | 代码中保留 `repeated` |
| stream | `stream` / 流式 | 代码中保留 `stream` |

### HTTP / 传输层

| English | 推荐中文 | 说明 |
|---|---|---|
| endpoint | 终端节点（概念） / 请求地址（具体值） | 不要混用终端节点 / 终结点 / 端点 |
| request URI | 请求 URI / 请求地址 | 需要严格时保留 URI |
| resource path | 资源路径 | |
| route data | 路由数据 | 框架语境 |
| query parameter | 查询参数 | |
| path parameter | 路径参数 | |
| request header / response header | 请求头 / 响应头 | gRPC 专文可用“头信息 / 尾信息” |
| trailer | 尾信息 | 首次可写“响应尾信息（trailer）” |
| request body / response body | 请求体 / 响应体 | 可接受变体：请求主体 / 请求消息体 / 返回体 |
| payload | 有效载荷 | 只在协议/规范语境里用 |
| content negotiation | 内容协商 | |
| representation | 表示形式 | |
| HTTP method | HTTP 请求方法 | token 保持 `GET` / `POST` 等 |
| status code | HTTP 状态码 / gRPC 状态码 | 有歧义时要带前缀 |
| error code | 错误码 | 业务/应用层 |
| RequestId | `RequestId` | prose 可说“请求 ID” |

## 类型名和标识符

### 推荐策略

- 代码、schema、`.proto`、JSON 示例里，保留英文类型 token。
- 说明文字里，再用中文解释其含义。
- 一个表里不要一会儿写 `String`，一会儿又写“字符串”，要选一种并保持一致。

### 建议做法

对于参数表、字段表，推荐：

- **类型列**：使用英文 token，例如 `String`、`Integer`、`Boolean`、`Array<Object>`、`int32`、`string`。
- **描述列**：用中文解释语义。

这样做有两个好处：

- 和真实接口/代码更一致。
- 避免把 `string`、`String`、`文本`、`字符串`、`字串` 混成多个层级。

## 建议统一掉的变体

### Header 家族

推荐 house term：

- 通用 API 文档：`请求头` / `响应头`
- gRPC metadata 语境：`头信息` / `尾信息`

不要在同一套文档里混用：

- 请求头
- 请求标头
- 头信息

### Body 家族

推荐 house term：

- `请求体` / `响应体`

只在偏协议、构造请求、低层说明时才使用：

- 请求主体
- 请求消息体
- 返回体
- 响应正文

### Endpoint 家族

推荐 house term：

- 讲概念时：`终端节点（Endpoint）`
- 给出具体 URL 时：`请求地址`
- 如果你们明确把 host 和 path 分开，可以在 host 那一栏用：`接口请求域名`

### Interceptor

推荐 house term：

- `拦截器`

不要默认采用：

- `侦听器`

除非你们决定刻意对齐某个特定平台的既有中文译名。

### Deadline

推荐 house term：

- `截止时间`

避免混用：

- 截止期限
- 截止日期

## 最容易翻坏的点

1. **`call` 不是 `request`。**
   - `RPC call` 是“RPC 调用”。
   - `request message` 是“请求消息”。
   - 不要都翻成“请求”。

2. **`message` 不是 `body`。**
   - gRPC / protobuf 的 `message` 是“消息”。
   - HTTP 的 `body` 是“请求体 / 响应体”。

3. **`field` 不是 `parameter`。**
   - `field` -> 字段
   - `parameter` -> 参数

4. **`deadline` 不是 `timeout`。**
   - `deadline` 是绝对时间点。
   - `timeout` 是等待时长。

5. **`201`、`202`、`204` 不能都翻成“成功”。**
   - `201 Created` -> 已创建 / 创建成功
   - `202 Accepted` -> 已接受，但处理尚未完成
   - `204 No Content` -> 成功，但无响应体

6. **`HTTP 状态码` 和 `错误码` 不是一回事。**
   - 例如 `400` 是状态码。
   - 例如 `error_code`、`APIG.2000`、`DLI.0001` 是错误码。

7. **不要翻译真实字段名。**
   - 保持 `RequestId`、`error_code`、`Content-Type`、`Location`、`X-TC-Action` 原样。

## gRPC 状态码翻译策略

建议：

- **状态常量名保持英文**：例如 `NOT_FOUND`、`ALREADY_EXISTS`、`DEADLINE_EXCEEDED`。
- **中文只翻译描述**。

可参考的中文描述风格：

- `NOT_FOUND` -> 未找到
- `ALREADY_EXISTS` -> 已存在
- `PERMISSION_DENIED` -> 无权限 / 权限不足
- `RESOURCE_EXHAUSTED` -> 资源耗尽
- `DEADLINE_EXCEEDED` -> 超过截止时间

## 页面结构建议

### 通用 API 参考页

1. 接口描述
2. 请求地址
3. 请求方法
4. 路径参数
5. 查询参数
6. 请求头
7. 请求体
8. 响应体
9. HTTP 状态码
10. 错误码
11. 示例
12. RequestId / trace 字段

### gRPC / Protobuf 参考页

1. 服务定义
2. RPC 方法
3. 请求消息
4. 响应消息
5. 字段说明
6. 元数据
7. 截止时间 / 取消 / 重试
8. 状态码
9. 示例

## 推荐模板句

- 使用 `.proto` 中的 `message` 定义请求消息和响应消息。
- 该 RPC 为一元调用。
- 该 RPC 为服务端流式 RPC。
- 客户端可以通过请求头 `Authorization` 发送凭据。
- 响应头中会返回 `RequestId`。
- 当返回 `202 Accepted` 时，表示请求已被接受，但处理尚未完成。
- 当超过截止时间（deadline）时，客户端会中止调用。
- 请求失败时，HTTP 状态码和错误码应分别查看。

## 最终 house style 口号

**中文解释语义，英文保留协议。**
