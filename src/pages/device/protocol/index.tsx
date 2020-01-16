import React, { Fragment, useEffect, useState } from 'react';
import { ColumnProps, PaginationConfig, SorterResult } from 'antd/es/table';
import { Divider, Card, Table, Modal, message, Button, Tag, Popconfirm } from 'antd';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import styles from '@/utils/table.less';
import Search from './search';
import { ProtocolItem } from './data';
import ConnectState, { Dispatch, Loading } from '@/models/connect';
import { connect } from 'dva';
import encodeQueryParam from '@/utils/encodeParam';
import Save from './save';
interface Props {
  protocol: any;
  dispatch: Dispatch;
  location: Location;
  loading: Loading;
}

interface State {
  data: any;
  searchParam: any;
  saveVisible: boolean;
  current: Partial<ProtocolItem>;
}

const ProtocolList: React.FC<Props> = props => {
  const { dispatch } = props;

  const result = props.protocol.result;

  const initState: State = {
    data: result,
    searchParam: { pageSize: 10 },
    saveVisible: false,
    current: {},
  };

  const [searchParam, setSearchParam] = useState(initState.searchParam);
  const [saveVisible, setSaveVisible] = useState(initState.saveVisible);
  const [current, setCurrent] = useState(initState.current);

  const columns: ColumnProps<ProtocolItem>[] = [
    {
      title: '名称',
      dataIndex: 'name',
    },

    {
      title: '描述',
      dataIndex: 'description',
    },
    {
      title: '状态',
      dataIndex: 'state',
      render: text =>
        text === 1 ? <Tag color="#87d068">已发布</Tag> : <Tag color="#f50">未发布</Tag>,
    },
    {
      title: '操作',
      width: '300px',
      render: (text, record) => (
        <Fragment>
          <a onClick={() => edit(record)}>编辑</a>
          <Divider type="vertical" />
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record)}>
            <a>删除</a>
          </Popconfirm>
          <Divider type="vertical" />
          {record.state === 1 ? (
            <Popconfirm title="确认取消发布？" onConfirm={() => changeDeploy('_un-deploy', record)}>
              <a>取消发布</a>
            </Popconfirm>
          ) : (
            <Popconfirm title="确认发布？" onConfirm={() => changeDeploy('_deploy', record)}>
              <a>发布</a>
            </Popconfirm>
          )}
        </Fragment>
      ),
    },
  ];

  const changeDeploy = (type: string, record: ProtocolItem) => {
    dispatch({
      type: 'protocol/changeDeploy',
      payload: {
        id: record.id,
        type,
      },
      callback: response => {
        message.success('操作成功');
        handleSearch();
      },
    });
  };

  useEffect(() => {
    handleSearch(searchParam);
  }, []);

  const handleSearch = (params?: any) => {
    dispatch({
      type: 'protocol/query',
      payload: encodeQueryParam(params),
    });
  };

  const edit = (record: ProtocolItem) => {
    setCurrent(record);
    setSaveVisible(true);
  };

  const saveOrUpdate = (item: ProtocolItem) => {
    dispatch({
      type: 'protocol/insert',
      payload: encodeQueryParam(item),
      callback: response => {
        setSaveVisible(false);
        handleSearch(searchParam);
      },
    });
  };
  const handleDelete = (params: any) => {
    dispatch({
      type: 'protocol/remove',
      payload: params.id,
      callback: response => {
        message.success('删除成功');
        handleSearch();
      },
    });
  };

  const onTableChange = (
    pagination: PaginationConfig,
    filters: any,
    sorter: SorterResult<ProtocolItem>,
    extra: any,
  ) => {
    handleSearch({
      pageIndex: Number(pagination.current) - 1,
      pageSize: pagination.pageSize,
      terms: searchParam,
      sorts: sorter,
    });
  };

  return (
    <PageHeaderWrapper title="协议管理">
      <Card bordered={false}>
        <div className={styles.tableList}>
          <div>
            <Search
              search={(params: any) => {
                setSearchParam(params);
                handleSearch({ terms: params, pageSize: 10 });
              }}
            />
          </div>
          <div className={styles.tableListOperator}>
            <Button
              icon="plus"
              type="primary"
              onClick={() => {
                setCurrent({});
                setSaveVisible(true);
              }}
            >
              新建
            </Button>
          </div>
          <div className={styles.StandardTable}>
            <Table
              // loading={props.loading.global}
              dataSource={(result || {}).data}
              columns={columns}
              rowKey={'id'}
              onChange={onTableChange}
              pagination={{
                current: result.pageIndex + 1,
                total: result.total,
                pageSize: result.pageSize,
                showQuickJumper: true,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (total: number) => {
                  return (
                    `共 ${total} 条记录 第  ` +
                    (result.pageIndex + 1) +
                    '/' +
                    Math.ceil(result.total / result.pageSize) +
                    '页'
                  );
                },
              }}
            />
          </div>
        </div>
      </Card>
      {saveVisible && (
        <Save
          data={current}
          close={() => {
            setSaveVisible(false);
          }}
          save={(data: ProtocolItem) => {
            saveOrUpdate(data);
          }}
        />
      )}
    </PageHeaderWrapper>
  );
};
export default connect(({ protocol, loading }: ConnectState) => ({
  protocol,
  loading,
}))(ProtocolList);