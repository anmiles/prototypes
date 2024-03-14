import '../number';

describe('src/lib/number', () => {
	describe('case', () => {
		it('should use zero case if the last digit of the number is 0 or more than 5', () => {
			expect((0).case('дней', 'день', 'дня')).toEqual('дней');
			expect((20).case('дней', 'день', 'дня')).toEqual('дней');
			expect((5).case('дней', 'день', 'дня')).toEqual('дней');
			expect((26).case('дней', 'день', 'дня')).toEqual('дней');
			expect((109).case('дней', 'день', 'дня')).toEqual('дней');
		});

		it('should use one case if the last digit of the number is 1', () => {
			expect((1).case('дней', 'день', 'дня')).toEqual('день');
			expect((21).case('дней', 'день', 'дня')).toEqual('день');
		});

		it('should use two case if the last digit of the number is between 2 and 4', () => {
			expect((2).case('дней', 'день', 'дня')).toEqual('дня');
			expect((3).case('дней', 'день', 'дня')).toEqual('дня');
			expect((4).case('дней', 'день', 'дня')).toEqual('дня');
			expect((22).case('дней', 'день', 'дня')).toEqual('дня');
			expect((23).case('дней', 'день', 'дня')).toEqual('дня');
			expect((24).case('дней', 'день', 'дня')).toEqual('дня');
		});

		it('should use zero case if two last digits of number are between 10 and 20', () => {
			expect((11).case('дней', 'день', 'дня')).toEqual('дней');
			expect((112).case('дней', 'день', 'дня')).toEqual('дней');
			expect((13).case('дней', 'день', 'дня')).toEqual('дней');
			expect((114).case('дней', 'день', 'дня')).toEqual('дней');
			expect((15).case('дней', 'день', 'дня')).toEqual('дней');
		});
	});

	describe('pad', () => {
		it("should add zeros to the left part until it's length is equal required", () => {
			expect(100.5.pad(5)).toEqual('00100.5');
		});

		it("should add zeros to the right part until it's length is equal required", () => {
			expect(100.5.pad(0, 3)).toEqual('100.500');
		});

		it('should turn integer into float if right zeros are required', () => {
			expect((100).pad(4, 3)).toEqual('0100.000');
		});
	});
});
