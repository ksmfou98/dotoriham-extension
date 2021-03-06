import Tree, {
  ItemId,
  mutateTree,
  RenderItemParams,
  TreeData,
} from '@atlaskit/tree';
import produce from 'immer';
import React, { ReactElement, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import useFolderListQuery from '../hooks/useFolderListQuery';
import { createFolderAPI } from '../lib/api/folder';
import { PLUS_ICON } from '../lib/constants';
import { scrollbar } from '../lib/styles/utilStyles';
import { findChildrenLengthById } from '../lib/utils/atlaskitTreeFinder';
import FolderItemIcon from './FolderItemIcon';

interface FolderListBoxProps {
  onSelectFolder: (folderId: ItemId) => void;
  selectedFolderId: ItemId;
}

interface IFolderItem {
  id: ItemId;
  children: ItemId[];
  data: {
    name: string;
  };
}

function FolderListBox({
  onSelectFolder,
  selectedFolderId,
}: FolderListBoxProps): ReactElement {
  const { data } = useFolderListQuery();
  const [folders, setFolders] = useState<TreeData>({
    rootId: '',
    items: {
      '': {
        id: '',
        children: [],
        data: '',
      },
    },
  });

  useEffect(() => {
    if (!data) return;
    setFolders(data);
  }, [data]);

  // 새로운 폴더 데이터 생성
  const createNewFolderData = (folderId: ItemId, name: string) => {
    return {
      id: folderId,
      children: [],
      data: {
        name,
      },
    };
  };

  // 새로운 폴더 데이터를 현재 폴더 리스트에 추가
  const addNewDataInFolders = (
    folderId: ItemId,
    parentId: ItemId,
    newData: IFolderItem,
  ) => {
    setFolders((prev) =>
      produce(prev, (draft) => {
        const newObj = draft;
        newObj.items[folderId] = newData;
        newObj.items[parentId].children.push(folderId);
        if (parentId !== 'root') {
          newObj.items[parentId].isExpanded = true;
        }
      }),
    );
  };

  const onExpandFolder = (itemId: ItemId) => {
    setFolders(mutateTree(folders, itemId, { isExpanded: true }));
  };

  const onCollapseFolder = (itemId: ItemId) => {
    setFolders(mutateTree(folders, itemId, { isExpanded: false }));
  };

  const onCreateFolder = async (parentId: ItemId) => {
    const folderChildrenLength = findChildrenLengthById(folders, parentId);
    const requestBody = {
      parentId,
      name: '제목없음',
      index: folderChildrenLength,
    };

    try {
      const { folderId } = await createFolderAPI(requestBody);
      const newFolderData = createNewFolderData(folderId, requestBody.name);
      addNewDataInFolders(folderId, parentId, newFolderData);
    } catch (e) {
      console.error(e);
    }
  };

  const renderFolderItem = ({
    item,
    onExpand,
    onCollapse,
    provided,
  }: RenderItemParams): ReactElement => {
    return (
      <>
        <FolderItemWrapper
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <FolderItemBlock
            active={selectedFolderId === item.id}
            onClick={() =>
              item.children.length > 0 && item.isExpanded
                ? onCollapse(item.id)
                : onExpand(item.id)
            }
          >
            <FolderLeftBox>
              <FolderItemIcon
                item={item}
                onCollapse={onCollapse}
                onExpand={onExpand}
              />
              <FolderTitle
                active={selectedFolderId === item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFolder(item.id);
                }}
              >
                {item.data.name}
              </FolderTitle>
            </FolderLeftBox>

            <FolderRightBox
              className="right"
              onClick={(e) => e.stopPropagation()}
            >
              <FolderAddButton onClick={() => onCreateFolder(item.id)}>
                <img src={PLUS_ICON} alt="더하기 버튼" />
              </FolderAddButton>
            </FolderRightBox>
          </FolderItemBlock>
        </FolderItemWrapper>
      </>
    );
  };

  return (
    <FolderListBoxStyled>
      <FolderListWrapper>
        <Tree
          tree={folders}
          renderItem={renderFolderItem}
          onExpand={onExpandFolder}
          onCollapse={onCollapseFolder}
          offsetPerLevel={16} // 한 깊이당 padding 값
          isNestingEnabled
        />
      </FolderListWrapper>
    </FolderListBoxStyled>
  );
}

const FolderListBoxStyled = styled.div`
  height: 280px;
  overflow: auto;
  margin-bottom: 20px;
  ${scrollbar};
`;

const FolderListWrapper = styled.div`
  position: relative;
`;

const FolderItemWrapper = styled.div`
  width: 156px;
`;

const FolderRightBox = styled.div`
  display: none;
  align-items: center;
`;

const FolderItemBlock = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  min-width: 105px;
  max-width: 166px;
  height: 28px;
  font-size: 12px;
  padding: 5px 2px;
  border-radius: 4px;
  ${(props) =>
    props.active &&
    css`
      background-color: rgba(72, 191, 145, 0.1);
      font-weight: 500;
      ${FolderRightBox} {
        display: flex;
      }
    `}
  &:hover {
    background-color: rgba(72, 191, 145, 0.1);
    font-weight: 500;
    ${FolderRightBox} {
      display: flex;
    }
  }
`;

const FolderLeftBox = styled.div`
  display: flex;
  align-items: center;
  min-width: 65px;
`;

const FolderTitle = styled.span<{ active: boolean }>`
  cursor: pointer;
  height: 28px;
  line-height: 25px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  &:hover {
    text-decoration: underline;
  }
  ${(props) =>
    props.active &&
    css`
      font-weight: 500;
      color: #48bf91;
    `}
`;

const FolderAddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
`;

export default FolderListBox;
