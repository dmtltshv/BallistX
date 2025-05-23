import { render, screen, fireEvent } from '@testing-library/react';
import InputForm from './InputForm'; // путь корректируй, если файл в другой папке

const mockBullets = [
  { id: '1', name: 'Пуля А', caliber: '7.62', weight: 10, bc: 0.45 },
  { id: '2', name: 'Пуля Б', caliber: '5.45', weight: 7, bc: 0.38 },
  { id: '3', name: 'Пуля В', caliber: '7.62', weight: 9, bc: 0.42 },
];

test('при выборе калибра отображаются только соответствующие пули', () => {
  render(
    <InputForm
      bullet={null}
      setBullet={jest.fn()}
      setInputValues={jest.fn()}
      setConditions={jest.fn()}
      inputValues={{ velocity: '', zeroRange: '', maxRange: '', step: '', scopeHeight: '' }}
      conditions={{ temperature: '', pressure: '', windSpeed: '', windAngle: '' }}
      isFieldMode={true}
      onCalculate={jest.fn()}
      results={[]}
      setResults={jest.fn()}
      setOriginalResults={jest.fn()}
      customBullets={mockBullets}
    />
  );

  // Выбираем калибр 7.62
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '7.62' } });

  // Проверяем, что отобразились пули этого калибра
  expect(screen.getByText(/Пуля А/i)).toBeInTheDocument();
  expect(screen.getByText(/Пуля В/i)).toBeInTheDocument();

  // И не отобразилась пуля с другим калибром
  expect(screen.queryByText(/Пуля Б/i)).not.toBeInTheDocument();
});
