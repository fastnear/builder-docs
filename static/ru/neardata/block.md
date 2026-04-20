# NEAR Data API - Финализированный блок
Получить финализированный блок по высоте
Получите полный документ финализированного блока на выбранной высоте — заголовок плюс каждый чанк и данные шарда.
## Ссылки на источник
- https://docs.fastnear.com/ru/neardata/block
- https://docs.fastnear.com/ru/apis/neardata/v0/block
- https://docs.fastnear.com/ru/apis/neardata/openapi/blocks/get_block
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v0/block/{block_height}`
- Исходная спецификация: `apis/neardata/v0/block.yaml`
## Сети
- Mainnet: https://mainnet.neardata.xyz/
- Testnet: https://testnet.neardata.xyz/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ подписки FastNear. Неверные значения могут вернуть `401` до обработки перенаправления.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://mainnet.neardata.xyz/v0/block/9820210
- Активный пример: Mainnet
## Справка по запросу
### Активный пример
```json
{
  "body": null,
  "headers": {},
  "path": {
    "block_height": "9820210"
  },
  "query": {}
}
```
### Входные данные
- `block_height` (путь, обязательный, string): Высота блока NEAR для запроса.
### Параметры пути

- `block_height` (путь, обязательный, string): Высота блока NEAR для запроса.

### Параметры запроса

- `apiKey` (query, string): Необязательный API-ключ подписки FastNear. Неверные значения могут вернуть `401` до обработки перенаправления.

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Запрошенный документ или `null`, если выбранный срез отсутствует
### Схема ответа
```json
{
  "type": "object",
  "description": "Full block document as served by neardata, including the block envelope and per-shard payloads.",
  "required": [
    "блок",
    "shards"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "блок",
      "required": true,
      "schema": {
        "type": "object",
        "description": "Block-level payload returned by neardata.",
        "required": [
          "author",
          "chunks",
          "header"
        ],
        "additionalProperties": false,
        "properties": [
          {
            "name": "author",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Block producer account ID."
            }
          },
          {
            "name": "chunks",
            "required": true,
            "schema": {
              "type": "array",
              "items": {
                "type": "object",
                "description": "Chunk header object as served by neardata.",
                "additionalProperties": true,
                "properties": [
                  {
                    "name": "chunk_hash",
                    "required": false,
                    "schema": {
                      "type": "string"
                    }
                  },
                  {
                    "name": "gas_limit",
                    "required": false,
                    "schema": {
                      "type": "integer"
                    }
                  },
                  {
                    "name": "gas_used",
                    "required": false,
                    "schema": {
                      "type": "integer"
                    }
                  },
                  {
                    "name": "height_created",
                    "required": false,
                    "schema": {
                      "type": "integer",
                      "format": "uint64"
                    }
                  },
                  {
                    "name": "height_included",
                    "required": false,
                    "schema": {
                      "type": "integer",
                      "format": "uint64"
                    }
                  },
                  {
                    "name": "outcome_root",
                    "required": false,
                    "schema": {
                      "type": "string"
                    }
                  },
                  {
                    "name": "outgoing_receipts_root",
                    "required": false,
                    "schema": {
                      "type": "string"
                    }
                  },
                  {
                    "name": "prev_block_hash",
                    "required": false,
                    "schema": {
                      "type": "string"
                    }
                  },
                  {
                    "name": "shard_id",
                    "required": false,
                    "schema": {
                      "type": "integer",
                      "format": "uint64"
                    }
                  },
                  {
                    "name": "tx_root",
                    "required": false,
                    "schema": {
                      "type": "string"
                    }
                  }
                ],
                "refName": "ChunkHeader"
              }
            }
          },
          {
            "name": "header",
            "required": true,
            "schema": {
              "type": "object",
              "description": "Block header object as served by neardata.",
              "additionalProperties": true,
              "properties": [
                {
                  "name": "chunks_included",
                  "required": false,
                  "schema": {
                    "type": "integer",
                    "format": "uint64"
                  }
                },
                {
                  "name": "epoch_id",
                  "required": false,
                  "schema": {
                    "type": "string"
                  }
                },
                {
                  "name": "gas_price",
                  "required": false,
                  "schema": {
                    "type": "string"
                  }
                },
                {
                  "name": "hash",
                  "required": false,
                  "schema": {
                    "type": "string"
                  }
                },
                {
                  "name": "height",
                  "required": false,
                  "schema": {
                    "type": "integer",
                    "format": "uint64"
                  }
                },
                {
                  "name": "next_epoch_id",
                  "required": false,
                  "schema": {
                    "type": "string"
                  }
                },
                {
                  "name": "prev_hash",
                  "required": false,
                  "schema": {
                    "type": "string"
                  }
                },
                {
                  "name": "prev_height",
                  "required": false,
                  "schema": {
                    "type": "integer",
                    "format": "uint64"
                  }
                },
                {
                  "name": "timestamp",
                  "required": false,
                  "schema": {
                    "type": "integer"
                  }
                },
                {
                  "name": "timestamp_nanosec",
                  "required": false,
                  "schema": {
                    "type": "string"
                  }
                },
                {
                  "name": "total_supply",
                  "required": false,
                  "schema": {
                    "type": "string"
                  }
                }
              ],
              "refName": "BlockHeader"
            }
          }
        ],
        "refName": "BlockEnvelope"
      }
    },
    {
      "name": "shards",
      "required": true,
      "schema": {
        "type": "array",
        "items": {
          "type": "object",
          "description": "Per-shard payload returned by neardata for a block.",
          "required": [
            "chunk",
            "receipt_execution_outcomes",
            "shard_id",
            "state_changes"
          ],
          "additionalProperties": false,
          "properties": [
            {
              "name": "chunk",
              "required": true,
              "schema": {
                "type": "object",
                "description": "Chunk payload returned by neardata for a single shard in a selected block.",
                "required": [
                  "author",
                  "header",
                  "квитанции",
                  "транзакции"
                ],
                "additionalProperties": false,
                "properties": [
                  {
                    "name": "author",
                    "required": true,
                    "schema": {
                      "type": "string",
                      "description": "Chunk producer account ID."
                    }
                  },
                  {
                    "name": "header",
                    "required": true,
                    "schema": {
                      "type": "object",
                      "description": "Chunk header object as served by neardata.",
                      "additionalProperties": true,
                      "properties": [
                        {
                          "name": "chunk_hash",
                          "required": false,
                          "schema": {
                            "type": "string"
                          }
                        },
                        {
                          "name": "gas_limit",
                          "required": false,
                          "schema": {
                            "type": "integer"
                          }
                        },
                        {
                          "name": "gas_used",
                          "required": false,
                          "schema": {
                            "type": "integer"
                          }
                        },
                        {
                          "name": "height_created",
                          "required": false,
                          "schema": {
                            "type": "integer",
                            "format": "uint64"
                          }
                        },
                        {
                          "name": "height_included",
                          "required": false,
                          "schema": {
                            "type": "integer",
                            "format": "uint64"
                          }
                        },
                        {
                          "name": "outcome_root",
                          "required": false,
                          "schema": {
                            "type": "string"
                          }
                        },
                        {
                          "name": "outgoing_receipts_root",
                          "required": false,
                          "schema": {
                            "type": "string"
                          }
                        },
                        {
                          "name": "prev_block_hash",
                          "required": false,
                          "schema": {
                            "type": "string"
                          }
                        },
                        {
                          "name": "shard_id",
                          "required": false,
                          "schema": {
                            "type": "integer",
                            "format": "uint64"
                          }
                        },
                        {
                          "name": "tx_root",
                          "required": false,
                          "schema": {
                            "type": "string"
                          }
                        }
                      ],
                      "refName": "ChunkHeader"
                    }
                  },
                  {
                    "name": "квитанции",
                    "required": true,
                    "schema": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "description": "Receipt object as served by neardata inside a chunk payload.",
                        "required": [
                          "predecessor_id",
                          "priority",
                          "квитанция",
                          "receipt_id",
                          "receiver_id"
                        ],
                        "additionalProperties": false,
                        "properties": [
                          {
                            "name": "predecessor_id",
                            "required": true,
                            "schema": {
                              "type": "string"
                            }
                          },
                          {
                            "name": "priority",
                            "required": true,
                            "schema": {
                              "type": "integer",
                              "format": "uint64"
                            }
                          },
                          {
                            "name": "квитанция",
                            "required": true,
                            "schema": {
                              "oneOf": [
                                {
                                  "type": "object",
                                  "required": [
                                    "Action"
                                  ],
                                  "additionalProperties": false,
                                  "properties": [
                                    {
                                      "name": "Action",
                                      "required": true,
                                      "schema": {
                                        "type": "object",
                                        "required": [
                                          "actions",
                                          "gas_price",
                                          "input_data_ids",
                                          "is_promise_yield",
                                          "output_data_receivers",
                                          "signer_id",
                                          "signer_public_key"
                                        ],
                                        "additionalProperties": false,
                                        "properties": [
                                          {
                                            "name": "actions",
                                            "required": true,
                                            "schema": {
                                              "type": "array",
                                              "items": {
                                                "type": "object",
                                                "additionalProperties": true,
                                                "refName": "ActionDocument"
                                              }
                                            }
                                          },
                                          {
                                            "name": "gas_price",
                                            "required": true,
                                            "schema": {
                                              "type": "string"
                                            }
                                          },
                                          {
                                            "name": "input_data_ids",
                                            "required": true,
                                            "schema": {
                                              "type": "array",
                                              "items": {
                                                "type": "string"
                                              }
                                            }
                                          },
                                          {
                                            "name": "is_promise_yield",
                                            "required": true,
                                            "schema": {
                                              "type": "boolean"
                                            }
                                          },
                                          {
                                            "name": "output_data_receivers",
                                            "required": true,
                                            "schema": {
                                              "type": "array",
                                              "items": {
                                                "type": "object",
                                                "required": [
                                                  "data_id",
                                                  "receiver_id"
                                                ],
                                                "additionalProperties": false,
                                                "properties": [
                                                  {
                                                    "name": "data_id",
                                                    "required": true,
                                                    "schema": {
                                                      "type": "string"
                                                    }
                                                  },
                                                  {
                                                    "name": "receiver_id",
                                                    "required": true,
                                                    "schema": {
                                                      "type": "string"
                                                    }
                                                  }
                                                ],
                                                "refName": "OutputDataReceiverDocument"
                                              }
                                            }
                                          },
                                          {
                                            "name": "signer_id",
                                            "required": true,
                                            "schema": {
                                              "type": "string"
                                            }
                                          },
                                          {
                                            "name": "signer_public_key",
                                            "required": true,
                                            "schema": {
                                              "type": "string"
                                            }
                                          }
                                        ],
                                        "refName": "ActionReceiptDocument"
                                      }
                                    }
                                  ],
                                  "refName": "ActionReceiptBody"
                                },
                                {
                                  "type": "object",
                                  "required": [
                                    "Data"
                                  ],
                                  "additionalProperties": false,
                                  "properties": [
                                    {
                                      "name": "Data",
                                      "required": true,
                                      "schema": {
                                        "type": "object",
                                        "required": [
                                          "data",
                                          "data_id",
                                          "is_promise_resume"
                                        ],
                                        "additionalProperties": false,
                                        "properties": [
                                          {
                                            "name": "data",
                                            "required": true,
                                            "schema": {
                                              "type": "string"
                                            }
                                          },
                                          {
                                            "name": "data_id",
                                            "required": true,
                                            "schema": {
                                              "type": "string"
                                            }
                                          },
                                          {
                                            "name": "is_promise_resume",
                                            "required": true,
                                            "schema": {
                                              "type": "boolean"
                                            }
                                          }
                                        ],
                                        "refName": "DataReceiptDocument"
                                      }
                                    }
                                  ],
                                  "refName": "DataReceiptBody"
                                }
                              ],
                              "refName": "ReceiptBody"
                            }
                          },
                          {
                            "name": "receipt_id",
                            "required": true,
                            "schema": {
                              "type": "string"
                            }
                          },
                          {
                            "name": "receiver_id",
                            "required": true,
                            "schema": {
                              "type": "string"
                            }
                          }
                        ],
                        "refName": "ReceiptDocument"
                      }
                    }
                  },
                  {
                    "name": "транзакции",
                    "required": true,
                    "schema": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "description": "Transaction entry returned inside a neardata chunk.",
                        "required": [
                          "outcome",
                          "транзакция"
                        ],
                        "additionalProperties": false,
                        "properties": [
                          {
                            "name": "outcome",
                            "required": true,
                            "schema": {
                              "type": "object",
                              "description": "Execution result paired with an optional receipt object.",
                              "required": [
                                "execution_outcome",
                                "квитанция"
                              ],
                              "additionalProperties": false,
                              "properties": [
                                {
                                  "name": "execution_outcome",
                                  "required": true,
                                  "schema": {
                                    "type": "object",
                                    "required": [
                                      "block_hash",
                                      "id",
                                      "outcome",
                                      "доказательство"
                                    ],
                                    "additionalProperties": false,
                                    "properties": [
                                      {
                                        "name": "block_hash",
                                        "required": true,
                                        "schema": {
                                          "type": "string"
                                        }
                                      },
                                      {
                                        "name": "id",
                                        "required": true,
                                        "schema": {
                                          "type": "string"
                                        }
                                      },
                                      {
                                        "name": "outcome",
                                        "required": true,
                                        "schema": {
                                          "type": "object",
                                          "required": [
                                            "executor_id",
                                            "gas_burnt",
                                            "logs",
                                            "metadata",
                                            "receipt_ids",
                                            "статус",
                                            "tokens_burnt"
                                          ],
                                          "additionalProperties": false,
                                          "properties": [
                                            {
                                              "name": "executor_id",
                                              "required": true,
                                              "schema": {
                                                "type": "string"
                                              }
                                            },
                                            {
                                              "name": "gas_burnt",
                                              "required": true,
                                              "schema": {
                                                "type": "integer",
                                                "format": "uint64"
                                              }
                                            },
                                            {
                                              "name": "logs",
                                              "required": true,
                                              "schema": {
                                                "type": "array",
                                                "items": {
                                                  "type": "string"
                                                }
                                              }
                                            },
                                            {
                                              "name": "metadata",
                                              "required": true,
                                              "schema": {
                                                "type": "object",
                                                "additionalProperties": true
                                              }
                                            },
                                            {
                                              "name": "receipt_ids",
                                              "required": true,
                                              "schema": {
                                                "type": "array",
                                                "items": {
                                                  "type": "string"
                                                }
                                              }
                                            },
                                            {
                                              "name": "статус",
                                              "required": true,
                                              "schema": {
                                                "oneOf": [
                                                  {
                                                    "type": "object",
                                                    "required": [
                                                      "SuccessReceiptId"
                                                    ],
                                                    "additionalProperties": false,
                                                    "properties": [
                                                      {
                                                        "name": "SuccessReceiptId",
                                                        "required": true,
                                                        "schema": {
                                                          "type": "string"
                                                        }
                                                      }
                                                    ],
                                                    "refName": "ExecutionOutcomeStatusSuccessReceiptId"
                                                  },
                                                  {
                                                    "type": "object",
                                                    "required": [
                                                      "SuccessValue"
                                                    ],
                                                    "additionalProperties": false,
                                                    "properties": [
                                                      {
                                                        "name": "SuccessValue",
                                                        "required": true,
                                                        "schema": {
                                                          "type": "string"
                                                        }
                                                      }
                                                    ],
                                                    "refName": "ExecutionOutcomeStatusSuccessValue"
                                                  },
                                                  {
                                                    "type": "object",
                                                    "required": [
                                                      "Failure"
                                                    ],
                                                    "additionalProperties": false,
                                                    "properties": [
                                                      {
                                                        "name": "Failure",
                                                        "required": true,
                                                        "schema": {
                                                          "type": "object",
                                                          "additionalProperties": true
                                                        }
                                                      }
                                                    ],
                                                    "refName": "ExecutionOutcomeStatusFailure"
                                                  }
                                                ],
                                                "refName": "ExecutionOutcomeStatus"
                                              }
                                            },
                                            {
                                              "name": "tokens_burnt",
                                              "required": true,
                                              "schema": {
                                                "type": "string"
                                              }
                                            }
                                          ],
                                          "refName": "ExecutionOutcomeSummary"
                                        }
                                      },
                                      {
                                        "name": "доказательство",
                                        "required": true,
                                        "schema": {
                                          "type": "array",
                                          "items": {
                                            "type": "object",
                                            "additionalProperties": true,
                                            "refName": "ExecutionProofItem"
                                          }
                                        }
                                      }
                                    ],
                                    "refName": "ExecutionOutcomeDocument"
                                  }
                                },
                                {
                                  "name": "квитанция",
                                  "required": true,
                                  "schema": {
                                    "type": "object",
                                    "description": "Receipt payload when neardata includes it for this entry.",
                                    "oneOf": [
                                      {
                                        "type": "object",
                                        "description": "Receipt object as served by neardata inside a chunk payload.",
                                        "required": [
                                          "predecessor_id",
                                          "priority",
                                          "квитанция",
                                          "receipt_id",
                                          "receiver_id"
                                        ],
                                        "additionalProperties": false,
                                        "properties": [
                                          {
                                            "name": "predecessor_id",
                                            "required": true,
                                            "schema": {
                                              "type": "string"
                                            }
                                          },
                                          {
                                            "name": "priority",
                                            "required": true,
                                            "schema": {
                                              "type": "integer",
                                              "format": "uint64"
                                            }
                                          },
                                          {
                                            "name": "квитанция",
                                            "required": true,
                                            "schema": {
                                              "oneOf": [
                                                {
                                                  "type": "object",
                                                  "required": [
                                                    "Action"
                                                  ],
                                                  "additionalProperties": false,
                                                  "properties": [
                                                    {
                                                      "name": "Action",
                                                      "required": true,
                                                      "schema": {
                                                        "type": "object",
                                                        "required": [
                                                          "actions",
                                                          "gas_price",
                                                          "input_data_ids",
                                                          "is_promise_yield",
                                                          "output_data_receivers",
                                                          "signer_id",
                                                          "signer_public_key"
                                                        ],
                                                        "additionalProperties": false,
                                                        "properties": [
                                                          {
                                                            "name": "actions",
                                                            "required": true,
                                                            "schema": {
                                                              "type": "array",
                                                              "items": {
                                                                "type": "object",
                                                                "additionalProperties": true,
                                                                "refName": "ActionDocument"
                                                              }
                                                            }
                                                          },
                                                          {
                                                            "name": "gas_price",
                                                            "required": true,
                                                            "schema": {
                                                              "type": "string"
                                                            }
                                                          },
                                                          {
                                                            "name": "input_data_ids",
                                                            "required": true,
                                                            "schema": {
                                                              "type": "array",
                                                              "items": {
                                                                "type": "string"
                                                              }
                                                            }
                                                          },
                                                          {
                                                            "name": "is_promise_yield",
                                                            "required": true,
                                                            "schema": {
                                                              "type": "boolean"
                                                            }
                                                          },
                                                          {
                                                            "name": "output_data_receivers",
                                                            "required": true,
                                                            "schema": {
                                                              "type": "array",
                                                              "items": {
                                                                "type": "object",
                                                                "required": [
                                                                  "data_id",
                                                                  "receiver_id"
                                                                ],
                                                                "additionalProperties": false,
                                                                "properties": [
                                                                  {
                                                                    "name": "data_id",
                                                                    "required": true,
                                                                    "schema": {
                                                                      "type": "string"
                                                                    }
                                                                  },
                                                                  {
                                                                    "name": "receiver_id",
                                                                    "required": true,
                                                                    "schema": {
                                                                      "type": "string"
                                                                    }
                                                                  }
                                                                ],
                                                                "refName": "OutputDataReceiverDocument"
                                                              }
                                                            }
                                                          },
                                                          {
                                                            "name": "signer_id",
                                                            "required": true,
                                                            "schema": {
                                                              "type": "string"
                                                            }
                                                          },
                                                          {
                                                            "name": "signer_public_key",
                                                            "required": true,
                                                            "schema": {
                                                              "type": "string"
                                                            }
                                                          }
                                                        ],
                                                        "refName": "ActionReceiptDocument"
                                                      }
                                                    }
                                                  ],
                                                  "refName": "ActionReceiptBody"
                                                },
                                                {
                                                  "type": "object",
                                                  "required": [
                                                    "Data"
                                                  ],
                                                  "additionalProperties": false,
                                                  "properties": [
                                                    {
                                                      "name": "Data",
                                                      "required": true,
                                                      "schema": {
                                                        "type": "object",
                                                        "required": [
                                                          "data",
                                                          "data_id",
                                                          "is_promise_resume"
                                                        ],
                                                        "additionalProperties": false,
                                                        "properties": [
                                                          {
                                                            "name": "data",
                                                            "required": true,
                                                            "schema": {
                                                              "type": "string"
                                                            }
                                                          },
                                                          {
                                                            "name": "data_id",
                                                            "required": true,
                                                            "schema": {
                                                              "type": "string"
                                                            }
                                                          },
                                                          {
                                                            "name": "is_promise_resume",
                                                            "required": true,
                                                            "schema": {
                                                              "type": "boolean"
                                                            }
                                                          }
                                                        ],
                                                        "refName": "DataReceiptDocument"
                                                      }
                                                    }
                                                  ],
                                                  "refName": "DataReceiptBody"
                                                }
                                              ],
                                              "refName": "ReceiptBody"
                                            }
                                          },
                                          {
                                            "name": "receipt_id",
                                            "required": true,
                                            "schema": {
                                              "type": "string"
                                            }
                                          },
                                          {
                                            "name": "receiver_id",
                                            "required": true,
                                            "schema": {
                                              "type": "string"
                                            }
                                          }
                                        ],
                                        "refName": "ReceiptDocument"
                                      },
                                      {
                                        "type": "object",
                                        "additionalProperties": false,
                                        "refName": "OmittedReceiptDocument"
                                      }
                                    ]
                                  }
                                },
                                {
                                  "name": "tx_hash",
                                  "required": false,
                                  "schema": {
                                    "type": "string"
                                  }
                                }
                              ],
                              "refName": "ExecutionWithReceipt"
                            }
                          },
                          {
                            "name": "транзакция",
                            "required": true,
                            "schema": {
                              "type": "object",
                              "required": [
                                "actions",
                                "hash",
                                "nonce",
                                "priority_fee",
                                "public_key",
                                "receiver_id",
                                "signature",
                                "signer_id"
                              ],
                              "additionalProperties": false,
                              "properties": [
                                {
                                  "name": "actions",
                                  "required": true,
                                  "schema": {
                                    "type": "array",
                                    "items": {
                                      "type": "object",
                                      "additionalProperties": true,
                                      "refName": "ActionDocument"
                                    }
                                  }
                                },
                                {
                                  "name": "hash",
                                  "required": true,
                                  "schema": {
                                    "type": "string"
                                  }
                                },
                                {
                                  "name": "nonce",
                                  "required": true,
                                  "schema": {
                                    "type": "integer",
                                    "format": "uint64"
                                  }
                                },
                                {
                                  "name": "priority_fee",
                                  "required": true,
                                  "schema": {
                                    "type": "integer",
                                    "format": "uint64"
                                  }
                                },
                                {
                                  "name": "public_key",
                                  "required": true,
                                  "schema": {
                                    "type": "string"
                                  }
                                },
                                {
                                  "name": "receiver_id",
                                  "required": true,
                                  "schema": {
                                    "type": "string"
                                  }
                                },
                                {
                                  "name": "signature",
                                  "required": true,
                                  "schema": {
                                    "type": "string"
                                  }
                                },
                                {
                                  "name": "signer_id",
                                  "required": true,
                                  "schema": {
                                    "type": "string"
                                  }
                                }
                              ],
                              "refName": "SignedTransactionDocument"
                            }
                          }
                        ],
                        "refName": "ChunkTransactionWrapper"
                      }
                    }
                  }
                ],
                "refName": "ChunkDocument"
              }
            },
            {
              "name": "receipt_execution_outcomes",
              "required": true,
              "schema": {
                "type": "array",
                "items": {
                  "type": "object",
                  "description": "Execution result paired with an optional receipt object.",
                  "required": [
                    "execution_outcome",
                    "квитанция"
                  ],
                  "additionalProperties": false,
                  "properties": [
                    {
                      "name": "execution_outcome",
                      "required": true,
                      "schema": {
                        "type": "object",
                        "required": [
                          "block_hash",
                          "id",
                          "outcome",
                          "доказательство"
                        ],
                        "additionalProperties": false,
                        "properties": [
                          {
                            "name": "block_hash",
                            "required": true,
                            "schema": {
                              "type": "string"
                            }
                          },
                          {
                            "name": "id",
                            "required": true,
                            "schema": {
                              "type": "string"
                            }
                          },
                          {
                            "name": "outcome",
                            "required": true,
                            "schema": {
                              "type": "object",
                              "required": [
                                "executor_id",
                                "gas_burnt",
                                "logs",
                                "metadata",
                                "receipt_ids",
                                "статус",
                                "tokens_burnt"
                              ],
                              "additionalProperties": false,
                              "properties": [
                                {
                                  "name": "executor_id",
                                  "required": true,
                                  "schema": {
                                    "type": "string"
                                  }
                                },
                                {
                                  "name": "gas_burnt",
                                  "required": true,
                                  "schema": {
                                    "type": "integer",
                                    "format": "uint64"
                                  }
                                },
                                {
                                  "name": "logs",
                                  "required": true,
                                  "schema": {
                                    "type": "array",
                                    "items": {
                                      "type": "string"
                                    }
                                  }
                                },
                                {
                                  "name": "metadata",
                                  "required": true,
                                  "schema": {
                                    "type": "object",
                                    "additionalProperties": true
                                  }
                                },
                                {
                                  "name": "receipt_ids",
                                  "required": true,
                                  "schema": {
                                    "type": "array",
                                    "items": {
                                      "type": "string"
                                    }
                                  }
                                },
                                {
                                  "name": "статус",
                                  "required": true,
                                  "schema": {
                                    "oneOf": [
                                      {
                                        "type": "object",
                                        "required": [
                                          "SuccessReceiptId"
                                        ],
                                        "additionalProperties": false,
                                        "properties": [
                                          {
                                            "name": "SuccessReceiptId",
                                            "required": true,
                                            "schema": {
                                              "type": "string"
                                            }
                                          }
                                        ],
                                        "refName": "ExecutionOutcomeStatusSuccessReceiptId"
                                      },
                                      {
                                        "type": "object",
                                        "required": [
                                          "SuccessValue"
                                        ],
                                        "additionalProperties": false,
                                        "properties": [
                                          {
                                            "name": "SuccessValue",
                                            "required": true,
                                            "schema": {
                                              "type": "string"
                                            }
                                          }
                                        ],
                                        "refName": "ExecutionOutcomeStatusSuccessValue"
                                      },
                                      {
                                        "type": "object",
                                        "required": [
                                          "Failure"
                                        ],
                                        "additionalProperties": false,
                                        "properties": [
                                          {
                                            "name": "Failure",
                                            "required": true,
                                            "schema": {
                                              "type": "object",
                                              "additionalProperties": true
                                            }
                                          }
                                        ],
                                        "refName": "ExecutionOutcomeStatusFailure"
                                      }
                                    ],
                                    "refName": "ExecutionOutcomeStatus"
                                  }
                                },
                                {
                                  "name": "tokens_burnt",
                                  "required": true,
                                  "schema": {
                                    "type": "string"
                                  }
                                }
                              ],
                              "refName": "ExecutionOutcomeSummary"
                            }
                          },
                          {
                            "name": "доказательство",
                            "required": true,
                            "schema": {
                              "type": "array",
                              "items": {
                                "type": "object",
                                "additionalProperties": true,
                                "refName": "ExecutionProofItem"
                              }
                            }
                          }
                        ],
                        "refName": "ExecutionOutcomeDocument"
                      }
                    },
                    {
                      "name": "квитанция",
                      "required": true,
                      "schema": {
                        "type": "object",
                        "description": "Receipt payload when neardata includes it for this entry.",
                        "oneOf": [
                          {
                            "type": "object",
                            "description": "Receipt object as served by neardata inside a chunk payload.",
                            "required": [
                              "predecessor_id",
                              "priority",
                              "квитанция",
                              "receipt_id",
                              "receiver_id"
                            ],
                            "additionalProperties": false,
                            "properties": [
                              {
                                "name": "predecessor_id",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              },
                              {
                                "name": "priority",
                                "required": true,
                                "schema": {
                                  "type": "integer",
                                  "format": "uint64"
                                }
                              },
                              {
                                "name": "квитанция",
                                "required": true,
                                "schema": {
                                  "oneOf": [
                                    {
                                      "type": "object",
                                      "required": [
                                        "Action"
                                      ],
                                      "additionalProperties": false,
                                      "properties": [
                                        {
                                          "name": "Action",
                                          "required": true,
                                          "schema": {
                                            "type": "object",
                                            "required": [
                                              "actions",
                                              "gas_price",
                                              "input_data_ids",
                                              "is_promise_yield",
                                              "output_data_receivers",
                                              "signer_id",
                                              "signer_public_key"
                                            ],
                                            "additionalProperties": false,
                                            "properties": [
                                              {
                                                "name": "actions",
                                                "required": true,
                                                "schema": {
                                                  "type": "array",
                                                  "items": {
                                                    "type": "object",
                                                    "additionalProperties": true,
                                                    "refName": "ActionDocument"
                                                  }
                                                }
                                              },
                                              {
                                                "name": "gas_price",
                                                "required": true,
                                                "schema": {
                                                  "type": "string"
                                                }
                                              },
                                              {
                                                "name": "input_data_ids",
                                                "required": true,
                                                "schema": {
                                                  "type": "array",
                                                  "items": {
                                                    "type": "string"
                                                  }
                                                }
                                              },
                                              {
                                                "name": "is_promise_yield",
                                                "required": true,
                                                "schema": {
                                                  "type": "boolean"
                                                }
                                              },
                                              {
                                                "name": "output_data_receivers",
                                                "required": true,
                                                "schema": {
                                                  "type": "array",
                                                  "items": {
                                                    "type": "object",
                                                    "required": [
                                                      "data_id",
                                                      "receiver_id"
                                                    ],
                                                    "additionalProperties": false,
                                                    "properties": [
                                                      {
                                                        "name": "data_id",
                                                        "required": true,
                                                        "schema": {
                                                          "type": "string"
                                                        }
                                                      },
                                                      {
                                                        "name": "receiver_id",
                                                        "required": true,
                                                        "schema": {
                                                          "type": "string"
                                                        }
                                                      }
                                                    ],
                                                    "refName": "OutputDataReceiverDocument"
                                                  }
                                                }
                                              },
                                              {
                                                "name": "signer_id",
                                                "required": true,
                                                "schema": {
                                                  "type": "string"
                                                }
                                              },
                                              {
                                                "name": "signer_public_key",
                                                "required": true,
                                                "schema": {
                                                  "type": "string"
                                                }
                                              }
                                            ],
                                            "refName": "ActionReceiptDocument"
                                          }
                                        }
                                      ],
                                      "refName": "ActionReceiptBody"
                                    },
                                    {
                                      "type": "object",
                                      "required": [
                                        "Data"
                                      ],
                                      "additionalProperties": false,
                                      "properties": [
                                        {
                                          "name": "Data",
                                          "required": true,
                                          "schema": {
                                            "type": "object",
                                            "required": [
                                              "data",
                                              "data_id",
                                              "is_promise_resume"
                                            ],
                                            "additionalProperties": false,
                                            "properties": [
                                              {
                                                "name": "data",
                                                "required": true,
                                                "schema": {
                                                  "type": "string"
                                                }
                                              },
                                              {
                                                "name": "data_id",
                                                "required": true,
                                                "schema": {
                                                  "type": "string"
                                                }
                                              },
                                              {
                                                "name": "is_promise_resume",
                                                "required": true,
                                                "schema": {
                                                  "type": "boolean"
                                                }
                                              }
                                            ],
                                            "refName": "DataReceiptDocument"
                                          }
                                        }
                                      ],
                                      "refName": "DataReceiptBody"
                                    }
                                  ],
                                  "refName": "ReceiptBody"
                                }
                              },
                              {
                                "name": "receipt_id",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              },
                              {
                                "name": "receiver_id",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              }
                            ],
                            "refName": "ReceiptDocument"
                          },
                          {
                            "type": "object",
                            "additionalProperties": false,
                            "refName": "OmittedReceiptDocument"
                          }
                        ]
                      }
                    },
                    {
                      "name": "tx_hash",
                      "required": false,
                      "schema": {
                        "type": "string"
                      }
                    }
                  ],
                  "refName": "ExecutionWithReceipt"
                }
              }
            },
            {
              "name": "shard_id",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "uint64"
              }
            },
            {
              "name": "state_changes",
              "required": true,
              "schema": {
                "type": "array",
                "items": {
                  "type": "object",
                  "description": "State change entry returned by neardata for a shard.",
                  "required": [
                    "cause",
                    "change",
                    "type"
                  ],
                  "additionalProperties": false,
                  "properties": [
                    {
                      "name": "cause",
                      "required": true,
                      "schema": {
                        "oneOf": [
                          {
                            "type": "object",
                            "required": [
                              "tx_hash",
                              "type"
                            ],
                            "additionalProperties": false,
                            "properties": [
                              {
                                "name": "tx_hash",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              },
                              {
                                "name": "type",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              }
                            ],
                            "refName": "StateChangeCauseTransactionProcessing"
                          },
                          {
                            "type": "object",
                            "required": [
                              "receipt_hash",
                              "type"
                            ],
                            "additionalProperties": false,
                            "properties": [
                              {
                                "name": "receipt_hash",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              },
                              {
                                "name": "type",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              }
                            ],
                            "refName": "StateChangeCauseReceiptProcessing"
                          },
                          {
                            "type": "object",
                            "required": [
                              "receipt_hash",
                              "type"
                            ],
                            "additionalProperties": false,
                            "properties": [
                              {
                                "name": "receipt_hash",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              },
                              {
                                "name": "type",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              }
                            ],
                            "refName": "StateChangeCauseActionReceiptGasReward"
                          }
                        ],
                        "refName": "StateChangeCause"
                      }
                    },
                    {
                      "name": "change",
                      "required": true,
                      "schema": {
                        "oneOf": [
                          {
                            "type": "object",
                            "required": [
                              "account_id",
                              "amount",
                              "code_hash",
                              "locked",
                              "storage_paid_at",
                              "storage_usage"
                            ],
                            "additionalProperties": false,
                            "properties": [
                              {
                                "name": "account_id",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              },
                              {
                                "name": "amount",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              },
                              {
                                "name": "code_hash",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              },
                              {
                                "name": "locked",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              },
                              {
                                "name": "storage_paid_at",
                                "required": true,
                                "schema": {
                                  "type": "integer",
                                  "format": "uint64"
                                }
                              },
                              {
                                "name": "storage_usage",
                                "required": true,
                                "schema": {
                                  "type": "integer",
                                  "format": "uint64"
                                }
                              }
                            ],
                            "refName": "StateChangeValueAccountUpdate"
                          },
                          {
                            "type": "object",
                            "required": [
                              "access_key",
                              "account_id",
                              "public_key"
                            ],
                            "additionalProperties": false,
                            "properties": [
                              {
                                "name": "access_key",
                                "required": true,
                                "schema": {
                                  "type": "object",
                                  "additionalProperties": true
                                }
                              },
                              {
                                "name": "account_id",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              },
                              {
                                "name": "public_key",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              }
                            ],
                            "refName": "StateChangeValueAccessKeyUpdate"
                          },
                          {
                            "type": "object",
                            "required": [
                              "account_id",
                              "key_base64",
                              "value_base64"
                            ],
                            "additionalProperties": false,
                            "properties": [
                              {
                                "name": "account_id",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              },
                              {
                                "name": "key_base64",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              },
                              {
                                "name": "value_base64",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              }
                            ],
                            "refName": "StateChangeValueDataUpdate"
                          },
                          {
                            "type": "object",
                            "required": [
                              "account_id",
                              "key_base64"
                            ],
                            "additionalProperties": false,
                            "properties": [
                              {
                                "name": "account_id",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              },
                              {
                                "name": "key_base64",
                                "required": true,
                                "schema": {
                                  "type": "string"
                                }
                              }
                            ],
                            "refName": "StateChangeValueDataDeletion"
                          }
                        ],
                        "refName": "StateChangeValue"
                      }
                    },
                    {
                      "name": "type",
                      "required": true,
                      "schema": {
                        "type": "string"
                      }
                    }
                  ],
                  "refName": "StateChangeItem"
                }
              }
            }
          ],
          "refName": "ShardDocument"
        }
      }
    }
  ],
  "refName": "BlockDocument"
}
```
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- FastNear предлагает щедрые кредиты и бесплатный пробный период.
- Быстро получите пробный аккаунт на [dashboard.fastnear.com](https://dashboard.fastnear.com).
