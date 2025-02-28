// Copyright 2017-2025 @polkadot/app-assets authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { DropdownItemProps } from 'semantic-ui-react';
import type { AssetInfo, AssetInfoComplete } from '@polkadot/react-hooks/types';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Dropdown, styled, Table } from '@polkadot/react-components';
import { formatNumber } from '@polkadot/util';

import { useTranslation } from '../translate.js';
import Account from './Account.js';
import useBalances from './useBalances.js';

interface Props {
  className?: string;
  infos?: AssetInfo[];
}

function Balances ({ className, infos = [] }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [selectedAssetValue, setSelectedAssetValue] = useState('0');
  const [info, setInfo] = useState<AssetInfoComplete | null>(null);
  const balances = useBalances(info?.id);

  const headerRef = useRef<([React.ReactNode?, string?, number?] | false)[]>([
    [t('accounts'), 'start'],
    [t('frozen'), 'start'],
    [t('sufficient'), 'start'],
    [],
    []
  ]);

  const completeInfos = useMemo(
    () => infos
      .filter((i): i is AssetInfoComplete => !!(i.details && i.metadata) && !i.details.supply.isZero())
      .sort((a, b) => a.id.cmp(b.id)),
    [infos]
  );

  const assetOptions = useMemo(
    () => completeInfos.map(({ id, metadata }) => ({
      text: `${metadata.name.toUtf8()} (${formatNumber(id)})`,
      value: id.toString()
    })),
    [completeInfos]
  );

  const siFormat = useMemo(
    (): [number, string] => info
      ? [info.metadata.decimals.toNumber(), info.metadata.symbol.toUtf8().toUpperCase()]
      : [0, 'NONE'],
    [info]
  );

  const onSearch = useCallback(
    (options: DropdownItemProps[], value: string): DropdownItemProps[] =>
      options.filter((options) => {
        const { text: optText, value: optValue } = options as { text: string, value: number };

        return parseInt(value) === optValue || optText.includes(value);
      }),
    []
  );

  useEffect((): void => {
    const info = completeInfos.find(({ id }) => id.toString() === selectedAssetValue);

    // if no info found (usually happens on first load), select the first one automatically
    if (!info) {
      setInfo(completeInfos.at(0) ?? null);
      setSelectedAssetValue(completeInfos.at(0)?.id?.toString() ?? '0');
    } else {
      setInfo(info);
    }
  }, [completeInfos, selectedAssetValue]);

  return (
    <StyledDiv className={className}>
      <Table
        empty={info && balances && t('No accounts with balances found for the asset')}
        filter={assetOptions.length
          ? (
            <Dropdown
              isFull
              label={t('the asset to query for balances')}
              onChange={setSelectedAssetValue}
              onSearch={onSearch}
              options={assetOptions}
              value={selectedAssetValue}
            />
          )
          : undefined
        }
        header={headerRef.current}
      >
        {info && balances?.map(({ account, accountId }) => (
          <Account
            account={account}
            accountId={accountId}
            assetId={info.id}
            key={accountId}
            minBalance={info.details.minBalance}
            siFormat={siFormat}
          />
        ))}
      </Table>
    </StyledDiv>
  );
}

const StyledDiv = styled.div`
  table {
    overflow: auto;
  }
`;

export default React.memo(Balances);
